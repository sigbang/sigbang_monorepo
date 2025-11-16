import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../repositories/auth_repository.dart';

class Logout {
  const Logout(this._authRepository);

  final AuthRepository _authRepository;

  Future<Either<Failure, void>> call() async {
    try {
      // 로그아웃 수행 (토큰 정리는 AuthService에서 자동 처리됨)
      return await _authRepository.logout();
    } catch (e) {
      return const Left(AuthFailure(message: '로그아웃 중 오류가 발생했습니다'));
    }
  }
}
