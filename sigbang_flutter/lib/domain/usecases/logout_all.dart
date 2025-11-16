import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../repositories/auth_repository.dart';

class LogoutAll {
  const LogoutAll(this._authRepository);

  final AuthRepository _authRepository;

  Future<Either<Failure, void>> call() async {
    try {
      return await _authRepository.logoutAll();
    } catch (e) {
      return const Left(AuthFailure(message: '전체 로그아웃 중 오류가 발생했습니다'));
    }
  }
}
