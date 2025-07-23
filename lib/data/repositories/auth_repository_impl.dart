import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_service.dart';

class AuthRepositoryImpl implements AuthRepository {
  const AuthRepositoryImpl(this._authService);

  final AuthService _authService;

  @override
  Future<Either<Failure, User>> loginWithGoogle() async {
    try {
      final userModel = await _authService.signInWithGoogle();
      return Right(userModel.toDomain());
    } catch (e) {
      if (e.toString().contains('네트워크')) {
        return const Left(NetworkFailure(message: '네트워크 연결을 확인해주세요'));
      } else if (e.toString().contains('서버')) {
        return const Left(ServerFailure(message: '서버에 문제가 발생했습니다'));
      } else {
        return Left(AuthFailure(message: e.toString()));
      }
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      await _authService.signOut();
      return const Right(null);
    } catch (e) {
      return Left(AuthFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, User?>> getCurrentUser() async {
    try {
      final userModel = await _authService.getCurrentUser();
      return Right(userModel?.toDomain());
    } catch (e) {
      if (e.toString().contains('네트워크')) {
        return const Left(NetworkFailure(message: '네트워크 연결을 확인해주세요'));
      } else if (e.toString().contains('서버')) {
        return const Left(ServerFailure(message: '서버에 문제가 발생했습니다'));
      } else {
        return Left(AuthFailure(message: e.toString()));
      }
    }
  }

  @override
  Future<bool> isLoggedIn() async {
    try {
      return await _authService.isSignedIn();
    } catch (e) {
      return false;
    }
  }

  @override
  Future<void> saveAccessToken(String token) async {
    await _authService.saveAccessToken(token);
  }

  @override
  Future<String?> getAccessToken() async {
    return await _authService.getAccessToken();
  }

  @override
  Future<void> clearAccessToken() async {
    await _authService.clearAccessToken();
  }
}
