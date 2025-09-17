import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../core/config/env_config.dart';
import '../../core/utils/jwt_utils.dart';
import 'secure_storage_service.dart';

class ApiClient {
  late Dio _dio;
  late Function? _onTokenExpired;
  Future<bool>? _ongoingRefresh;

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
        sendTimeout: const Duration(seconds: 60),
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

    // 요청 인터셉터 (Access Token 자동 추가 + 사전 만료 검사)
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          try {
            String? accessToken = await SecureStorageService.getAccessToken();

            // 토큰이 있고 만료 임박/만료 시 사전 갱신 시도
            if (accessToken != null &&
                JwtUtils.isExpired(accessToken,
                    leewaySeconds: EnvConfig.accessLeewaySeconds)) {
              final refreshed = await _refreshToken();
              if (!refreshed) {
                // 갱신 실패 시 로그아웃 처리
                await _handleLogout();
              } else {
                accessToken = await SecureStorageService.getAccessToken();
              }
            }

            if (accessToken != null) {
              options.headers['Authorization'] = 'Bearer $accessToken';
            }
          } catch (_) {
            // 무시하고 진행
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final statusCode = error.response?.statusCode;

          // 401 에러 시 자동 토큰 갱신
          if (statusCode == 401) {
            if (kDebugMode) {
              print('🔄 Token expired, attempting refresh...');
            }

            final success = await _refreshToken();
            if (success) {
              // 토큰 갱신 성공 시 원래 요청 재시도
              final accessToken = await SecureStorageService.getAccessToken();
              error.requestOptions.headers['Authorization'] =
                  'Bearer $accessToken';

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
          // 403 에러 시 사용자 상태 재검증
          else if (statusCode == 403) {
            if (kDebugMode) {
              print('🚫 Forbidden access, revalidating user status...');
            }
            await _handleForbidden();
          }
          handler.next(error);
        },
      ),
    );
  }

  // 외부에서 필요 시 호출 가능한 유효성 보장 함수
  Future<bool> ensureValidAccessToken() async {
    try {
      final accessToken = await SecureStorageService.getAccessToken();
      if (accessToken == null) return false;
      if (JwtUtils.isExpired(accessToken,
          leewaySeconds: EnvConfig.accessLeewaySeconds)) {
        return await _refreshToken();
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  // 토큰 갱신 (동일 시점 다중 호출 시 단일 요청으로 병합)
  Future<bool> _refreshToken() async {
    if (_ongoingRefresh != null) {
      return await _ongoingRefresh!;
    }

    _ongoingRefresh = _doRefreshToken().whenComplete(() {
      _ongoingRefresh = null;
    });
    return await _ongoingRefresh!;
  }

  Future<bool> _doRefreshToken() async {
    try {
      final refreshToken = await SecureStorageService.getRefreshToken();
      if (refreshToken == null) {
        if (kDebugMode) {
          print('❌ No refresh token found');
        }
        return false;
      }

      // 인터셉터가 없는 별도 Dio 인스턴스로 갱신 요청
      final response = await Dio(
        BaseOptions(
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 15),
          sendTimeout: const Duration(seconds: 30),
          headers: {'Content-Type': 'application/json'},
        ),
      ).post(
        '${EnvConfig.baseUrl}/auth/refresh',
        data: {'refreshToken': refreshToken},
      );

      if (response.statusCode == 200) {
        await SecureStorageService.saveTokens(
          accessToken: response.data['accessToken'],
          refreshToken: response.data['refreshToken'],
        );
        // 저장 가능한 경우 만료 시각 저장
        final newAccess = response.data['accessToken'] as String?;
        final exp = newAccess != null
            ? JwtUtils.getExpiryEpochSeconds(newAccess)
            : null;
        if (exp != null) {
          await SecureStorageService.saveAccessTokenExpiryEpoch(exp);
        }

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

  // 403 처리 (사용자 상태 재검증)
  Future<void> _handleForbidden() async {
    try {
      // 별도 Dio 인스턴스로 /users/me 조회
      final response = await Dio(
        BaseOptions(
          baseUrl: EnvConfig.baseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 15),
          headers: {
            'Content-Type': 'application/json',
            'Authorization':
                'Bearer ${await SecureStorageService.getAccessToken()}'
          },
        ),
      ).get('/users/me');

      if (response.statusCode == 200) {
        // 상태 확인 후 SUSPENDED/DELETED 처리
        final data = response.data is Map<String, dynamic>
            ? response.data
            : (response.data['data'] ?? response.data);
        final status = data['status']?.toString().toLowerCase();

        if (status == 'deleted') {
          // 탈퇴 계정 - 즉시 로그아웃
          await _handleLogout();
        } else if (status == 'suspended') {
          // 정지 계정 - 세션 업데이트만 (UI에서 처리)
          if (kDebugMode) {
            print('⚠️ Account suspended, UI will handle restrictions');
          }
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Failed to revalidate user status: $e');
      }
      // 재검증 실패 시 안전하게 로그아웃
      await _handleLogout();
    }
  }

  Dio get dio => _dio;
}
