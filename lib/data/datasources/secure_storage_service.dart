import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  // 토큰 저장
  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.write(key: 'access_token', value: accessToken);
    await _storage.write(key: 'refresh_token', value: refreshToken);
  }

  // 액세스 토큰 가져오기
  static Future<String?> getAccessToken() async {
    return await _storage.read(key: 'access_token');
  }

  // 리프레시 토큰 가져오기
  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: 'refresh_token');
  }

  // 모든 토큰 삭제
  static Future<void> clearTokens() async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }

  // 사용자 정보 저장
  static Future<void> saveUserInfo(String userJson) async {
    await _storage.write(key: 'user_info', value: userJson);
  }

  // 사용자 정보 가져오기
  static Future<String?> getUserInfo() async {
    return await _storage.read(key: 'user_info');
  }

  // 사용자 정보 삭제
  static Future<void> clearUserInfo() async {
    await _storage.delete(key: 'user_info');
  }

  // 모든 데이터 삭제
  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
