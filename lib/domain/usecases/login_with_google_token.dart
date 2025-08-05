import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../entities/user.dart';
import '../repositories/auth_repository.dart';

class LoginWithGoogleToken {
  const LoginWithGoogleToken(this._authRepository);

  final AuthRepository _authRepository;

  Future<Either<Failure, User>> call() async {
    try {
      final result = await _authRepository.loginWithGoogle();

      return result.fold(
        (failure) => Left(failure),
        (user) => Right(user), // 토큰 저장은 AuthService에서 자동 처리됨
      );
    } catch (e) {
      return const Left(AuthFailure(message: 'Google 로그인 중 오류가 발생했습니다'));
    }
  }
}
