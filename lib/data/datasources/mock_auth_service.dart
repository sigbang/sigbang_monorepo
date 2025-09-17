import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../../domain/entities/user.dart';
import '../models/login_response_model.dart';
import '../models/user_model.dart';

import 'secure_storage_service.dart';

/// 개발/테스트용 Mock AuthService
/// 실제 서버 없이도 로그인 플로우를 테스트할 수 있습니다.
class MockAuthService {
  static const String _mockUserId = "mock_user_123";
  static const String _mockEmail = "user@gmail.com";
  static const String _mockNickname = "구글사용자";
  static const String _mockProfileImage =
      "https://lh3.googleusercontent.com/a/default-user";
  static const UserStatus _mockStatus = UserStatus.active;

  /// Mock Google 로그인 응답을 생성합니다.
  static Map<String, dynamic> createMockGoogleResponse() {
    return {
      "accessToken":
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_access_token.${DateTime.now().millisecondsSinceEpoch}",
      "refreshToken":
          "mock_refresh_token_${DateTime.now().millisecondsSinceEpoch}",
      "expiresIn": 900,
      "user": {
        "id": _mockUserId,
        "email": _mockEmail,
        "nickname": _mockNickname,
        "profileImage": _mockProfileImage,
      }
    };
  }

  /// Mock 서버 응답으로 LoginResponseModel을 생성합니다.
  static Future<LoginResponseModel> mockGoogleLogin() async {
    if (kDebugMode) {
      print('🎭 Using Mock Google Login Response');
    }

    // 실제 서버 지연 시뮬레이션
    await Future.delayed(const Duration(milliseconds: 1000));

    final mockResponse = createMockGoogleResponse();
    final loginResponse = LoginResponseModel.fromJson(mockResponse);

    // 토큰 저장
    await SecureStorageService.saveTokens(
      accessToken: loginResponse.tokens.accessToken,
      refreshToken: loginResponse.tokens.refreshToken,
    );
    // 만료 시각 저장 (모의값 사용)
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final exp = loginResponse.tokens.expiresIn != null
        ? now + loginResponse.tokens.expiresIn!
        : now + 900;
    await SecureStorageService.saveAccessTokenExpiryEpoch(exp);

    // 사용자 정보 저장
    await SecureStorageService.saveUserInfo(
      json.encode(loginResponse.user.toJson()),
    );

    if (kDebugMode) {
      print('✅ Mock login successful');
      print('User: ${loginResponse.user.name} (${loginResponse.user.email})');
      print(
          'Access Token: ${loginResponse.tokens.accessToken.substring(0, 50)}...');
      print('Expires In: ${loginResponse.tokens.expiresIn} seconds');
    }

    return loginResponse;
  }

  /// Mock 토큰 갱신 응답을 생성합니다.
  static Map<String, dynamic> createMockRefreshResponse() {
    return {
      "accessToken":
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new_access_token.${DateTime.now().millisecondsSinceEpoch}",
      "refreshToken":
          "new_refresh_token_${DateTime.now().millisecondsSinceEpoch}",
      "expiresIn": 900,
    };
  }

  /// 현재 저장된 Mock 사용자 정보를 가져옵니다.
  static UserModel getMockCurrentUser() {
    return const UserModel(
      id: _mockUserId,
      email: _mockEmail,
      name: _mockNickname,
      avatarUrl: _mockProfileImage,
      status: _mockStatus,
    );
  }
}
