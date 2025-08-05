import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../core/config/env_config.dart';
import 'secure_storage_service.dart';

class ApiClient {
  late Dio _dio;
  late Function? _onTokenExpired;

  ApiClient({Function? onTokenExpired}) {
    _onTokenExpired = onTokenExpired;
    _initializeDio();
  }

  void _initializeDio() {
    _dio = Dio(
      BaseOptions(
        baseUrl: EnvConfig.baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    // 로그 인터셉터 (개발 환경에서만)
    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
        error: true,
      ));
    }

    // 요청 인터셉터 (Access Token 자동 추가)
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final accessToken = await SecureStorageService.getAccessToken();
          if (accessToken != null) {
            options.headers['Authorization'] = 'Bearer $accessToken';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          // 401 에러 시 자동 토큰 갱신
          if (error.response?.statusCode == 401) {
            if (kDebugMode) {
              print('🔄 Token expired, attempting refresh...');
            }
            
            final success = await _refreshToken();
            if (success) {
              // 토큰 갱신 성공 시 원래 요청 재시도
              final accessToken = await SecureStorageService.getAccessToken();
              error.requestOptions.headers['Authorization'] = 'Bearer $accessToken';
              
              if (kDebugMode) {
                print('✅ Token refreshed, retrying request...');
              }
              
              try {
                final response = await _dio.fetch(error.requestOptions);
                handler.resolve(response);
                return;
              } catch (e) {
                if (kDebugMode) {
                  print('❌ Retry failed: $e');
                }
              }
            } else {
              // 토큰 갱신 실패 시 로그아웃 처리
              if (kDebugMode) {
                print('❌ Token refresh failed, logging out...');
              }
              await _handleLogout();
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  // 토큰 갱신
  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await SecureStorageService.getRefreshToken();
      if (refreshToken == null) {
        if (kDebugMode) {
          print('❌ No refresh token found');
        }
        return false;
      }

      final response = await Dio().post(
        '${EnvConfig.baseUrl}/auth/refresh',
        data: {'refreshToken': refreshToken},
      );

      if (response.statusCode == 200) {
        await SecureStorageService.saveTokens(
          accessToken: response.data['accessToken'],
          refreshToken: response.data['refreshToken'],
        );
        
        if (kDebugMode) {
          print('✅ Tokens refreshed successfully');
        }
        return true;
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Token refresh failed: $e');
      }
    }
    return false;
  }

  // 로그아웃 처리
  Future<void> _handleLogout() async {
    await SecureStorageService.clearAll();
    if (_onTokenExpired != null) {
      _onTokenExpired!();
    }
  }

  Dio get dio => _dio;
} 