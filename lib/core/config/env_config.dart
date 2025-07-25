import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class EnvConfig {
  static String get baseUrl {
    return dotenv.env['BASE_URL'] ?? 'http://localhost:3000';
  }

  static bool get isProduction {
    return kReleaseMode;
  }

  static bool get isDevelopment {
    return kDebugMode;
  }

  static String get envFileName {
    if (kReleaseMode) {
      return '.env.prod';
    } else {
      return '.env.dev';
    }
  }

  static Future<void> load() async {
    try {
      await dotenv.load(fileName: envFileName);
      if (kDebugMode) {
        print('Environment loaded: $envFileName');
        print('BASE_URL: $baseUrl');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Warning: Could not load environment file ($envFileName): $e');
        print('Using default values instead');
        print('BASE_URL: $baseUrl (default)');
      }
      // 환경 파일이 없거나 오류가 있는 경우 기본값 사용
      // 이는 정상적인 동작이므로 앱이 계속 실행됨
    }
  }
}
