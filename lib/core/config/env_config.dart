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
        print('Error loading environment file: $e');
      }
      // 환경 파일이 없는 경우 기본값 사용
    }
  }
}
