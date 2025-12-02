import 'dart:async';
import 'package:flutter/material.dart';
import '../../data/datasources/secure_storage_service.dart';
import '../../data/datasources/api_client.dart';
import '../config/env_config.dart';
import '../../presentation/session/session_cubit.dart';

class SessionManager with WidgetsBindingObserver {
  SessionManager(this._apiClient, this._sessionCubit);

  final ApiClient _apiClient;
  final SessionCubit _sessionCubit;

  Timer? _timer;
  Timer? _profileTimer;
  bool _isInitialized = false;

  void start() {
    if (!_isInitialized) {
      WidgetsBinding.instance.addObserver(this);
      _isInitialized = true;
    }

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

    // Profile refresh throttle: check need at most hourly
    _profileTimer?.cancel();
    _profileTimer =
        Timer.periodic(const Duration(hours: 1), (_) => _sessionCubit.refreshIfNeeded());
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    _profileTimer?.cancel();
    _profileTimer = null;
    if (_isInitialized) {
      WidgetsBinding.instance.removeObserver(this);
      _isInitialized = false;
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);

    if (state == AppLifecycleState.resumed) {
      // App resumed, revalidate session
      _revalidateSession();
      // And refresh profile only if needed
      _sessionCubit.refreshIfNeeded();
    }
  }

  Future<void> _revalidateSession() async {
    try {
      final token = await SecureStorageService.getAccessToken();
      if (token == null) return;

      // Ensure token is still valid
      final isValid = await _apiClient.ensureValidAccessToken();
      if (!isValid) {
        // Token refresh failed, session expired
        return;
      }

      // Additional check: verify user status with /users/me
      await _checkUserStatus();
    } catch (e) {
      // If revalidation fails, let normal error handling take care of it
    }
  }

  Future<void> _checkUserStatus() async {
    try {
      final response = await _apiClient.dio.get('/users/me');
      if (response.statusCode == 200) {
        final data = response.data is Map<String, dynamic>
            ? response.data
            : (response.data['data'] ?? response.data);
        final status = data['status']?.toString().toLowerCase();

        if (status == 'deleted') {
          // Account deleted, clear session
          await SecureStorageService.clearAll();
        }
        // For suspended accounts, let UI handle the restrictions
      }
    } catch (e) {
      // If user status check fails, let normal error handling manage it
    }
  }
}
