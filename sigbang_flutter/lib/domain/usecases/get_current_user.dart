import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../entities/user.dart';
import '../repositories/auth_repository.dart';

class GetCurrentUser {
  const GetCurrentUser(this._authRepository);

  final AuthRepository _authRepository;

  Future<Either<Failure, User?>> call() async {
    try {
      return await _authRepository.getCurrentUser();
    } catch (e) {
      return const Left(AuthFailure(message: '사용자 정보를 가져오는 중 오류가 발생했습니다'));
    }
  }
}
