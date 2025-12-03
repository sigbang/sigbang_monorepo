import 'package:dio/dio.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:http_parser/http_parser.dart';
import '../../../core/config/env_config.dart';
import '../../../domain/entities/user.dart';
import '../../../core/image/image_processing_service.dart';
import '../../../core/image/image_picker_service.dart';
import '../../../domain/usecases/upload_image_with_presign.dart';
import '../../../data/datasources/api_client.dart';
import '../../session/session_cubit.dart';
import 'profile_edit_state.dart';
import 'package:image_picker/image_picker.dart';
import '../../common/image_source_sheet.dart';

class ProfileEditCubit extends Cubit<ProfileEditState> {
  final UploadImageWithPresign uploadImageWithPresign;
  final ApiClient apiClient;
  final SessionCubit sessionCubit;

  ProfileEditCubit({
    required this.uploadImageWithPresign,
    required this.apiClient,
    required this.sessionCubit,
  }) : super(const ProfileEditState());

  void _emit(ProfileEditState newState) {
    if (isClosed) return;
    emit(newState);
  }

  bool _isPicking = false;

  void init(User user) {
    _emit(state.copyWith(
      originalName: user.name,
      name: user.name,
      originalAvatarUrl: user.avatarUrl,
      avatarPreviewPath: null,
      isDirty: false,
    ));
  }

  Future<void> pickAvatar(dynamic context) async {
    if (_isPicking) return;
    _isPicking = true;
    try {
      final ImageSource? source =
          await showImageSourceSheet(context, includePresets: true);
      if (source == null) {
        // Caller may open presets UI when null returned.
        return;
      }
      final PickedImage? picked = await ImagePickerService.pickSingle(source);
      if (picked == null) return;

      final processed = await ImageProcessingService.processCroppedBytes(
        croppedBytes: picked.previewBytes,
        format: OutputFormat.webp,
      );

      _emit(state.copyWith(
        avatarBytes: processed.bytes,
        avatarPreviewPath: processed.tempFile?.path,
        isDirty: true,
        error: null,
      ));
    } finally {
      _isPicking = false;
    }
  }

  void setName(String value) {
    final trimmed = value;
    final bool dirty =
        trimmed.trim() != state.originalName || state.avatarBytes != null;
    _emit(state.copyWith(name: trimmed, isDirty: dirty, error: null));
  }

  Future<void> save() async {
    if (!state.isDirty || state.isSaving) return;

    final trimmed = state.name.trim();
    if (trimmed.isEmpty || trimmed.length < 2 || trimmed.length > 20) {
      emit(state.copyWith(error: '닉네임은 2~20자여야 합니다.'));
      return;
    }

    _emit(state.copyWith(isSaving: true, error: null));
    try {
      String? avatarUrl = state.originalAvatarUrl;

      // 1) 프로필 이미지가 변경된 경우: 웹과 동일하게 multipart 업로드 사용
      if (state.avatarBytes != null && state.avatarBytes!.isNotEmpty) {
        final fileBytes = state.avatarBytes!;
        final form = FormData.fromMap({
          'file': MultipartFile.fromBytes(
            fileBytes,
            filename: 'avatar.webp',
            contentType: MediaType('image', 'webp'),
          ),
        });
        final uploadRes = await apiClient.dio.post(
          '/users/me/profile-image',
          data: form,
          options: Options(headers: {'Content-Type': 'multipart/form-data'}),
        );
        final dynamic raw = uploadRes.data;
        if (raw is Map<String, dynamic>) {
          final url = (raw['profileImage'] ?? raw['image']) as String?;
          if (url != null && url.isNotEmpty) {
            avatarUrl = url;
          }
        }
      }

      // 2) 닉네임은 웹과 동일하게 PATCH /users/me
      await apiClient.dio.patch('/users/me', data: {'nickname': trimmed});

      // 3) 세션 사용자 정보를 최소 변경으로 갱신
      final current = sessionCubit.state.user;
      if (current != null) {
        final updatedUser = current.copyWith(
          name: trimmed,
          avatarUrl: _appendCacheBust(avatarUrl),
        );
        sessionCubit.setUser(updatedUser);
      }
      sessionCubit.markProfileStale();

      _emit(state.copyWith(
        originalName: trimmed,
        name: trimmed,
        originalAvatarUrl: avatarUrl,
        avatarBytes: null,
        avatarPreviewPath: null,
        isDirty: false,
        isSaving: false,
      ));
    } catch (_) {
      _emit(state.copyWith(
        isSaving: false,
        error: '저장에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      ));
    }
  }

  // Load preset images (same endpoint as web: GET /users/profile-images/defaults)
  Future<void> loadPresets() async {
    try {
      _emit(state.copyWith(isLoadingPresets: true, error: null));
      final res = await apiClient.dio.get('/users/profile-images/defaults');
      final dynamic raw = res.data;
      // Unwrap common API envelope shapes
      final dynamic top =
          (raw is Map && raw.containsKey('data')) ? raw['data'] : raw;
      final List<dynamic> items = _extractFirstList(top) ?? const [];
      final presets = <ProfileImagePreset>[];
      for (final it in items) {
        if (it is String) {
          presets.add(ProfileImagePreset(key: it, url: _toMediaUrl(it)));
        } else if (it is Map) {
          final obj = it;
          final keyRaw = (obj['key'] ?? obj['path'] ?? obj['id']);
          final urlRaw =
              (obj['url'] ?? obj['src'] ?? obj['path'] ?? obj['key']);
          final key = keyRaw != null ? keyRaw.toString() : '';
          final url = urlRaw != null ? urlRaw.toString() : key;
          presets.add(ProfileImagePreset(key: key, url: _toMediaUrl(url)));
        } else {
          final s = it.toString();
          presets.add(ProfileImagePreset(key: s, url: _toMediaUrl(s)));
        }
      }
      _emit(state.copyWith(isLoadingPresets: false, presets: presets));
    } catch (_) {
      _emit(state.copyWith(isLoadingPresets: false));
    }
  }

  // Set default preset (PATCH /users/me/profile-image/default { key })
  Future<void> setDefaultPreset(String key) async {
    try {
      _emit(state.copyWith(error: null));
      final res = await apiClient.dio
          .patch('/users/me/profile-image/default', data: {'key': key});
      final dynamic data = res.data;
      String? url;
      if (data is Map<String, dynamic>) {
        url = (data['profileImage'] ?? data['image']) as String?;
      }
      final newUrl = url ?? state.originalAvatarUrl;

      // update session and local state
      final current = sessionCubit.state.user;
      if (current != null) {
        sessionCubit
            .setUser(current.copyWith(avatarUrl: _appendCacheBust(newUrl)));
      }
      sessionCubit.markProfileStale();
      _emit(state.copyWith(
        originalAvatarUrl: newUrl,
        avatarBytes: null,
        avatarPreviewPath: null,
        // nickname dirty state is preserved
      ));
    } catch (_) {
      _emit(state.copyWith(
        error: '프리셋 적용에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      ));
    }
  }

  // Set random preset (PATCH /users/me/profile-image/random)
  Future<void> setRandomPreset() async {
    try {
      _emit(state.copyWith(error: null));
      final res = await apiClient.dio.patch('/users/me/profile-image/random');
      final dynamic data = res.data;
      String? url;
      if (data is Map<String, dynamic>) {
        url = (data['profileImage'] ?? data['image']) as String?;
      }
      final newUrl = url ?? state.originalAvatarUrl;

      final current = sessionCubit.state.user;
      if (current != null) {
        sessionCubit
            .setUser(current.copyWith(avatarUrl: _appendCacheBust(newUrl)));
      }
      sessionCubit.markProfileStale();
      _emit(state.copyWith(
        originalAvatarUrl: newUrl,
        avatarBytes: null,
        avatarPreviewPath: null,
      ));
    } catch (_) {
      _emit(state.copyWith(
        error: '랜덤 이미지 설정에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      ));
    }
  }

  String _toMediaUrl(String? pathOrUrl) {
    if (pathOrUrl == null || pathOrUrl.isEmpty) return '';
    final s = pathOrUrl;
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    final clean = s.startsWith('/') ? s.substring(1) : s;
    final path = clean.startsWith('media/')
        ? 'media/${clean.substring('media/'.length)}'
        : clean;
    return '${EnvConfig.siteUrl}/$path';
  }

  String? _appendCacheBust(String? url) {
    if (url == null || url.isEmpty) return url;
    // Avoid adding cache-busting to Supabase storage objects to prevent 400s,
    // and skip if a cache-busting param already exists.
    final lower = url.toLowerCase();
    final isSupabaseObject = lower.contains('supabase.co/storage/v1/object');
    final alreadyHasV = RegExp(r'([?&])v=\d+').hasMatch(url);
    if (isSupabaseObject || alreadyHasV) {
      return url;
    }
    final hasQuery = url.contains('?');
    final ts = DateTime.now().millisecondsSinceEpoch;
    return '$url${hasQuery ? '&' : '?'}v=$ts';
  }

  List<dynamic>? _extractFirstList(dynamic value) {
    if (value == null) return null;
    if (value is List) return value;
    if (value is Map) {
      for (final key in ['images', 'items', 'data', 'presets', 'list']) {
        final v = value[key];
        final found = _extractFirstList(v);
        if (found != null) return found;
      }
      for (final v in value.values) {
        final found = _extractFirstList(v);
        if (found != null) return found;
      }
    }
    return null;
  }
}
