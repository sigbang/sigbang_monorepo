import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../domain/usecases/login_with_google_token.dart';
import '../../../domain/usecases/logout.dart';
import 'login_state.dart';

class LoginCubit extends Cubit<LoginState> {
  LoginCubit({
    required LoginWithGoogleToken loginWithGoogleToken,
    required Logout logout,
  })  : _loginWithGoogleToken = loginWithGoogleToken,
        _logout = logout,
        super(const LoginInitial());

  final LoginWithGoogleToken _loginWithGoogleToken;
  final Logout _logout;

  Future<void> loginWithGoogle() async {
    emit(const LoginLoading());

    final result = await _loginWithGoogleToken();

    result.fold(
      (failure) => emit(LoginFailure(failure.message)),
      (user) => emit(LoginSuccess(user)),
    );
  }

  Future<void> logout() async {
    emit(const LoginLoading());

    final result = await _logout();

    result.fold(
      (failure) => emit(LoginFailure(failure.message)),
      (_) => emit(const LoginInitial()),
    );
  }
}
