import 'dart:async';
import '../../data/datasources/secure_storage_service.dart';
import '../../data/datasources/api_client.dart';
import '../config/env_config.dart';

class SessionManager {
  SessionManager(this._apiClient);

  final ApiClient _apiClient;

  Timer? _timer;

  void start() {
    _timer?.cancel();
    // Check periodically per config
    _timer = Timer.periodic(
        Duration(seconds: EnvConfig.backgroundCheckIntervalSeconds), (_) async {
      try {
        final exp = await SecureStorageService.getAccessTokenExpiryEpoch();
        if (exp == null) return;
        final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
        // If exp within configured proactive window, try to refresh now
        if (exp - now <= EnvConfig.proactiveRefreshWindowSeconds) {
          await _apiClient.ensureValidAccessToken();
        }
      } catch (_) {}
    });
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }
}
