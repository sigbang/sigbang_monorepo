import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../entities/user.dart';
import '../repositories/auth_repository.dart';

class InitializeAuth {
  const InitializeAuth(this._authRepository);

  final AuthRepository _authRepository;

  Future<Either<Failure, User?>> call() async {
    try {
      // 저장된 토큰 확인 및 사용자 정보 복원
      final isLoggedIn = await _authRepository.isLoggedIn();
      if (isLoggedIn) {
        return await _authRepository.getCurrentUser();
      }
      return const Right(null);
    } catch (e) {
      return const Left(AuthFailure(message: '초기화 중 오류가 발생했습니다'));
    }
  }
}
