import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../core/config/env_config.dart';
import '../models/user_model.dart';

import '../models/login_response_model.dart';
import 'api_client.dart';
import 'secure_storage_service.dart';

class AuthService {
  final ApiClient _apiClient;
  final GoogleSignIn _googleSignIn;

  AuthService({
    ApiClient? apiClient,
    GoogleSignIn? googleSignIn,
    Function? onTokenExpired,
  })  : _apiClient = apiClient ?? ApiClient(onTokenExpired: onTokenExpired),
        _googleSignIn = googleSignIn ??
            GoogleSignIn(
              scopes: ['email', 'profile', 'openid'],
            );

  /// 저장된 사용자 정보 초기화
  Future<void> initialize() async {
    try {
      final token = await getAccessToken();
      if (token != null) {
        // 토큰이 있으면 사용자 정보 갱신
        await getCurrentUser();

        if (kDebugMode) {
          print('🔄 User session restored');
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Session restoration failed: $e');
      }
      // 세션 복원 실패 시 로컬 데이터 정리
      await SecureStorageService.clearAll();
    }
  }

  /// Google 로그인을 수행하고 서버에서 JWT를 받아옵니다.
  Future<UserModel> signInWithGoogle() async {
    try {
      // 1. 기존 로그인 확인 및 로그아웃
      if (_googleSignIn.currentUser != null) {
        await _googleSignIn.signOut();
      }

      // 2. Google Sign In
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        throw Exception('Google 로그인이 취소되었습니다');
      }

      if (kDebugMode) {
        print('=== Google Sign In Success ===');
        print('User: ${googleUser.email}');
        print('Display Name: ${googleUser.displayName}');
        print('ID: ${googleUser.id}');
      }

      // 3. Google ID Token 획득
      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;
      final String? idToken = googleAuth.idToken;

      if (idToken == null) {
        throw Exception('Google ID Token을 가져올 수 없습니다. Google 설정을 확인해주세요.');
      }

      if (kDebugMode) {
        print('=== Sending to Server ===');
        print('URL: ${EnvConfig.baseUrl}/auth/google');
        print('ID Token length: ${idToken.length}');
      }

      // 4. 서버에 ID Token 전송하여 JWT 받기
      final response = await _apiClient.dio.post(
        '/auth/google',
        data: {'idToken': idToken},
      );

      if (response.statusCode == 200) {
        final loginResponse = LoginResponseModel.fromJson(response.data);

        // 토큰 저장
        await SecureStorageService.saveTokens(
          accessToken: loginResponse.tokens.accessToken,
          refreshToken: loginResponse.tokens.refreshToken,
        );

        // 사용자 정보 저장
        await SecureStorageService.saveUserInfo(
            json.encode(loginResponse.user.toJson()));

        if (kDebugMode) {
          print('✅ Google login successful');
          print(
              'User: ${loginResponse.user.name} (${loginResponse.user.email})');
          print(
              'Access Token: ${loginResponse.tokens.accessToken.substring(0, 50)}...');
          if (loginResponse.tokens.expiresIn != null) {
            print('Expires In: ${loginResponse.tokens.expiresIn} seconds');
          }
        }

        return loginResponse.user;
      } else {
        throw Exception('서버 인증 실패: ${response.statusCode}');
      }
    } on DioException catch (e) {
      if (kDebugMode) {
        print('❌ DioException: ${e.response?.statusCode}');
        print('Response: ${e.response?.data}');
      }

      if (e.response?.statusCode == 400) {
        final errorMsg = e.response?.data['message'] ?? '잘못된 요청입니다';
        throw Exception('요청 오류 (400): $errorMsg');
      } else if (e.response?.statusCode == 401) {
        throw Exception('인증이 거부되었습니다');
      } else if (e.response?.statusCode == 500) {
        throw Exception('서버 오류가 발생했습니다');
      } else {
        throw Exception('네트워크 오류: ${e.message}');
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Google login error: $e');
      }
      throw Exception('Google 로그인 실패: $e');
    }
  }

  /// 로그아웃을 수행합니다.
  Future<void> signOut() async {
    try {
      // 서버에 로그아웃 요청
      final refreshToken = await SecureStorageService.getRefreshToken();
      if (refreshToken != null) {
        try {
          await _apiClient.dio.post(
            '/auth/signout',
            data: {'refreshToken': refreshToken},
          );
        } catch (e) {
          if (kDebugMode) {
            print('⚠️ Server logout failed: $e');
          }
        }
      }

      // Google 로그아웃
      await _googleSignIn.signOut();

      // 로컬 데이터 정리
      await SecureStorageService.clearAll();

      if (kDebugMode) {
        print('✅ Logout completed');
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Logout error: $e');
      }
      throw Exception('로그아웃 실패: $e');
    }
  }

  /// 모든 기기에서 로그아웃을 수행합니다.
  Future<void> signOutAll() async {
    try {
      await _apiClient.dio.post('/auth/signout-all');
      await _googleSignIn.signOut();
      await SecureStorageService.clearAll();

      if (kDebugMode) {
        print('✅ Logout from all devices completed');
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Logout all error: $e');
      }
      throw Exception('전체 로그아웃 실패: $e');
    }
  }

  /// 서버에서 현재 사용자 정보를 가져옵니다.
  Future<UserModel?> getCurrentUser() async {
    try {
      // 먼저 로컬에 저장된 사용자 정보 확인
      final userInfo = await SecureStorageService.getUserInfo();
      if (userInfo != null) {
        try {
          final userJson = json.decode(userInfo);
          return UserModel.fromJson(userJson);
        } catch (e) {
          if (kDebugMode) {
            print('⚠️ Invalid local user data, fetching from server...');
          }
        }
      }

      // 로컬에 없으면 서버에서 가져오기
      final token = await getAccessToken();
      if (token == null) {
        return null;
      }

      final response = await _apiClient.dio.get('/auth/me');

      if (response.statusCode == 200) {
        final userModel = UserModel.fromJson(response.data);

        // 로컬에 저장
        await SecureStorageService.saveUserInfo(
            json.encode(userModel.toJson()));

        return userModel;
      } else {
        return null;
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        // 토큰이 만료되었거나 유효하지 않음 (인터셉터에서 자동 갱신됨)
        await SecureStorageService.clearUserInfo();
        return null;
      }
      throw Exception('사용자 정보 조회 실패: ${e.message}');
    } catch (e) {
      if (kDebugMode) {
        print('❌ Get current user error: $e');
      }
      throw Exception('사용자 정보 조회 실패: $e');
    }
  }

  /// 액세스 토큰을 가져옵니다.
  Future<String?> getAccessToken() async {
    return await SecureStorageService.getAccessToken();
  }

  /// 리프레시 토큰을 가져옵니다.
  Future<String?> getRefreshToken() async {
    return await SecureStorageService.getRefreshToken();
  }

  /// 현재 로그인 상태를 확인합니다.
  Future<bool> isSignedIn() async {
    final token = await SecureStorageService.getAccessToken();
    return token != null && token.isNotEmpty;
  }
}
