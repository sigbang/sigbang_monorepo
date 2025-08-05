import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../entities/user.dart';

abstract class AuthRepository {
  /// 인증 시스템을 초기화합니다.
  Future<void> initialize();

  /// Google 로그인을 통해 사용자를 인증합니다.
  Future<Either<Failure, User>> loginWithGoogle();

  /// 로그아웃을 수행합니다.
  Future<Either<Failure, void>> logout();

  /// 모든 기기에서 로그아웃을 수행합니다.
  Future<Either<Failure, void>> logoutAll();

  /// 현재 로그인된 사용자 정보를 가져옵니다.
  Future<Either<Failure, User?>> getCurrentUser();

  /// 사용자의 로그인 상태를 확인합니다.
  Future<bool> isLoggedIn();

  /// 저장된 액세스 토큰을 가져옵니다.
  Future<String?> getAccessToken();

  /// 저장된 리프레시 토큰을 가져옵니다.
  Future<String?> getRefreshToken();
}
