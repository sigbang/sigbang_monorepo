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

  Future<void> refreshFromServer() async {
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
    }
  }
}
