import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'api_client.dart';

class AnalyticsService {
  final ApiClient _api;
  AnalyticsService(this._api);

  Future<void> logImpressions({
    required String surface, // 'feed' | 'popular' | 'recommended'
    String? expId,
    String? expVariant,
    String? seed,
    String? cursor,
    String? sessionId,
    required List<Map<String, dynamic>> items, // [{recipeId, position, rankScore?}]
  }) async {
    if (items.isEmpty) return;
    try {
      await _api.dio.post('/events/reco/impressions', data: {
        'surface': surface,
        if (expId != null) 'expId': expId,
        if (expVariant != null) 'expVariant': expVariant,
        if (seed != null) 'seed': seed,
        if (cursor != null) 'cursor': cursor,
        if (sessionId != null) 'sessionId': sessionId,
        'items': items,
      });
    } on DioException catch (e) {
      if (kDebugMode) {
        print('⚠️ logImpressions failed: ${e.response?.statusCode} ${e.message}');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ logImpressions error: $e');
      }
    }
  }

  Future<void> logClick({
    required String surface,
    required String recipeId,
    int? position,
    double? rankScore,
    String? expId,
    String? expVariant,
    String? seed,
    String? sessionId,
  }) async {
    try {
      await _api.dio.post('/events/reco/click', data: {
        'surface': surface,
        'recipeId': recipeId,
        if (position != null) 'position': position,
        if (rankScore != null) 'rankScore': rankScore,
        if (expId != null) 'expId': expId,
        if (expVariant != null) 'expVariant': expVariant,
        if (seed != null) 'seed': seed,
        if (sessionId != null) 'sessionId': sessionId,
      });
    } on DioException catch (e) {
      if (kDebugMode) {
        print('⚠️ logClick failed: ${e.response?.statusCode} ${e.message}');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ logClick error: $e');
      }
    }
  }
}


