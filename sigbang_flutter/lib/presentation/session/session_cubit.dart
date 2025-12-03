import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import '../../domain/entities/user.dart';
import '../../data/datasources/api_client.dart';

class SessionState {
  const SessionState({required this.isLoggedIn, this.user});
  final bool isLoggedIn;
  final User? user;
}

class SessionCubit extends Cubit<SessionState> {
  final ApiClient _api;
  SessionCubit(this._api) : super(const SessionState(isLoggedIn: false));

  void setGuest() => emit(const SessionState(isLoggedIn: false));
  void setUser(User user) => emit(SessionState(isLoggedIn: true, user: user));

  // Optimization flags
  bool _profileStale = false;
  bool _isRefreshing = false;
  DateTime? _lastSyncAt;

  void markProfileStale() {
    _profileStale = true;
  }

  Future<void> refreshIfNeeded({Duration maxAge = const Duration(hours: 1)}) async {
    if (_isRefreshing) return;
    final now = DateTime.now();
    final isFresh = _lastSyncAt != null && now.difference(_lastSyncAt!) < maxAge;
    if (!_profileStale && isFresh) return;
    await refreshFromServer();
  }

  Future<void> refreshFromServer() async {
    if (_isRefreshing) return;
    _isRefreshing = true;
    try {
      final res = await _api.dio.get(
        '/users/me',
        options: Options(headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }),
      );
      final dynamic raw = res.data;
      final data = raw is Map<String, dynamic> ? raw : (raw['data'] ?? raw);
      final updated = User(
        id: (data['id'] ?? '') as String,
        email: (data['email'] ?? '') as String,
        name: (data['nickname'] ?? data['name'] ?? '') as String,
        avatarUrl: (data['profileImage'] ?? data['image']) as String?,
        status: state.user?.status ?? UserStatus.active,
      );
      emit(SessionState(isLoggedIn: true, user: updated));
    } catch (_) {
      // ignore
    } finally {
      _lastSyncAt = DateTime.now();
      _profileStale = false;
      _isRefreshing = false;
    }
  }
}
