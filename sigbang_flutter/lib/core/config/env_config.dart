import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class EnvConfig {
  static String get baseUrl {
    return dotenv.env['BASE_URL'] ?? 'http://localhost:3000';
  }

  static String get supabaseUrl {
    return dotenv.env['SUPABASE_URL'] ?? '';
  }

  static String get supabaseAnonKey {
    return dotenv.env['SUPABASE_ANON_KEY'] ?? '';
  }

  static String get siteUrl {
    // 우선순위: SITE_URL > PUBLIC_BASE_URL > 기본값
    return dotenv.env['SITE_URL'] ??
        dotenv.env['PUBLIC_BASE_URL'] ??
        'https://sigbang.com';
  }

  static bool get isProduction {
    return kReleaseMode;
  }

  static bool get isDevelopment {
    return kDebugMode;
  }

  // Auth/session knobs
  static int get accessLeewaySeconds {
    final raw = dotenv.env['ACCESS_LEEWAY_SECONDS'];
    final parsed = raw != null ? int.tryParse(raw) : null;
    return parsed ?? 15; // default 15s
  }

  static int get backgroundCheckIntervalSeconds {
    final raw = dotenv.env['BACKGROUND_CHECK_INTERVAL_SECONDS'];
    final parsed = raw != null ? int.tryParse(raw) : null;
    return parsed ?? 30; // default 30s
  }

  static int get proactiveRefreshWindowSeconds {
    final raw = dotenv.env['PROACTIVE_REFRESH_WINDOW_SECONDS'];
    final parsed = raw != null ? int.tryParse(raw) : null;
    return parsed ?? 60; // default 60s
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
        if ((supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty)) {
          print('Supabase configured');
        }
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
