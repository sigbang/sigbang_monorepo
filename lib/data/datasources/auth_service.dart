import 'package:dio/dio.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/config/env_config.dart';
import '../models/user_model.dart';

class AuthService {
  static String get _baseUrl => EnvConfig.baseUrl; // 환경 변수에서 로드
  static const String _tokenKey = 'access_token';

  final Dio _dio;
  final GoogleSignIn _googleSignIn;

  AuthService({
    Dio? dio,
    GoogleSignIn? googleSignIn,
  })  : _dio = dio ?? Dio(),
        _googleSignIn = googleSignIn ?? GoogleSignIn();

  /// Google 로그인을 수행하고 서버에서 JWT를 받아옵니다.
  Future<UserModel> signInWithGoogle() async {
    try {
      // 1. Google Sign In
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        throw Exception('Google 로그인이 취소되었습니다');
      }

      // 2. Google ID Token 획득
      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;
      final String? idToken = googleAuth.idToken;

      if (idToken == null) {
        throw Exception('Google ID Token을 가져올 수 없습니다');
      }

      // 3. 서버에 ID Token 전송하여 JWT 받기
      final response = await _dio.post(
        '$_baseUrl/auth/google',
        data: {
          'id_token': idToken,
        },
        options: Options(
          headers: {
            'Content-Type': 'application/json',
          },
        ),
      );

      if (response.statusCode == 200) {
        final userData = response.data;
        return UserModel.fromJson(userData);
      } else {
        throw Exception('서버 인증 실패: ${response.statusCode}');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('인증이 거부되었습니다');
      } else if (e.response?.statusCode == 500) {
        throw Exception('서버 오류가 발생했습니다');
      } else {
        throw Exception('네트워크 오류: ${e.message}');
      }
    } catch (e) {
      throw Exception('Google 로그인 실패: $e');
    }
  }

  /// 로그아웃을 수행합니다.
  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
    } catch (e) {
      throw Exception('로그아웃 실패: $e');
    }
  }

  /// 액세스 토큰을 저장합니다.
  Future<void> saveAccessToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  /// 저장된 액세스 토큰을 가져옵니다.
  Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  /// 저장된 액세스 토큰을 삭제합니다.
  Future<void> clearAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  /// 현재 로그인 상태를 확인합니다.
  Future<bool> isSignedIn() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }

  /// 서버에서 현재 사용자 정보를 가져옵니다.
  Future<UserModel?> getCurrentUser() async {
    try {
      final token = await getAccessToken();
      if (token == null) {
        return null;
      }

      final response = await _dio.get(
        '$_baseUrl/auth/me',
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      if (response.statusCode == 200) {
        return UserModel.fromJson(response.data);
      } else {
        return null;
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        // 토큰이 만료되었거나 유효하지 않음
        await clearAccessToken();
        return null;
      }
      throw Exception('사용자 정보 조회 실패: ${e.message}');
    } catch (e) {
      throw Exception('사용자 정보 조회 실패: $e');
    }
  }
}
