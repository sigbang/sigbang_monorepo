import 'package:equatable/equatable.dart';

class ProfileEditState extends Equatable {
  final String originalName;
  final String name;
  final String? originalAvatarUrl;

  final List<int>? avatarBytes;
  final String? avatarPreviewPath;

  final bool isDirty;
  final bool isSaving;
  final String? error;
  final bool isLoadingPresets;
  final List<ProfileImagePreset> presets;

  const ProfileEditState({
    this.originalName = '',
    this.name = '',
    this.originalAvatarUrl,
    this.avatarBytes,
    this.avatarPreviewPath,
    this.isDirty = false,
    this.isSaving = false,
    this.error,
    this.isLoadingPresets = false,
    this.presets = const [],
  });

  ProfileEditState copyWith({
    String? originalName,
    String? name,
    String? originalAvatarUrl,
    List<int>? avatarBytes,
    String? avatarPreviewPath,
    bool? isDirty,
    bool? isSaving,
    String? error,
    bool? isLoadingPresets,
    List<ProfileImagePreset>? presets,
  }) {
    return ProfileEditState(
      originalName: originalName ?? this.originalName,
      name: name ?? this.name,
      originalAvatarUrl: originalAvatarUrl ?? this.originalAvatarUrl,
      avatarBytes: avatarBytes ?? this.avatarBytes,
      avatarPreviewPath: avatarPreviewPath ?? this.avatarPreviewPath,
      isDirty: isDirty ?? this.isDirty,
      isSaving: isSaving ?? this.isSaving,
      error: error,
      isLoadingPresets: isLoadingPresets ?? this.isLoadingPresets,
      presets: presets ?? this.presets,
    );
  }

  @override
  List<Object?> get props => [
        originalName,
        name,
        originalAvatarUrl,
        avatarBytes,
        avatarPreviewPath,
        isDirty,
        isSaving,
        error,
        isLoadingPresets,
        presets,
      ];
}

class ProfileImagePreset {
  final String key;
  final String? url;
  const ProfileImagePreset({required this.key, this.url});
}



