import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../domain/entities/recipe.dart';
import '../../domain/entities/recipe_query.dart';
import '../models/recipe_model.dart';
import '../models/paginated_recipes_model.dart';
import 'api_client.dart';

class RecipeService {
  final ApiClient _apiClient;

  RecipeService(this._apiClient);

  /// 피드 조회 (공개된 레시피만)
  Future<PaginatedRecipesModel> getFeed(
      RecipeQuery query, String? userId) async {
    if (kDebugMode) {
      print(
          '🍽️ Fetching recipe feed with query: ${query.toQueryParameters()}');
    }

    final response = await _apiClient.dio.get(
      '/recipes/feed',
      queryParameters: query.toQueryParameters(),
    );

    if (response.statusCode == 200) {
      if (kDebugMode) {
        print(
            '✅ Feed loaded: ${response.data['recipes']?.length ?? 0} recipes');
      }
      return PaginatedRecipesModel.fromJson(response.data);
    } else {
      throw Exception('피드 조회 실패: ${response.statusCode}');
    }
  }

  /// 레시피 상세 조회
  Future<RecipeModel> getRecipe(String id, String? userId) async {
    if (kDebugMode) {
      print('📖 Fetching recipe detail: $id');
    }

    final response = await _apiClient.dio.get('/recipes/$id');

    if (response.statusCode == 200) {
      final payload = response.data['data'] ?? response.data;
      if (kDebugMode) {
        try {
          print('✅ Recipe loaded: ${payload['title']}');
        } catch (_) {}
      }
      return RecipeModel.fromJson(payload as Map<String, dynamic>);
    } else {
      throw Exception('레시피 조회 실패: ${response.statusCode}');
    }
  }

  /// 레시피 즉시 생성(공개)
  Future<RecipeModel> createRecipe(Recipe recipe) async {
    if (kDebugMode) {
      print('📝 Creating recipe (publish immediately): ${recipe.title}');
    }

    final createDto = _recipeToCreateDto(recipe);
    final response = await _apiClient.dio.post(
      '/recipes',
      data: createDto,
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      final data = response.data['data'] ?? response.data;
      return RecipeModel.fromJson(data as Map<String, dynamic>);
    } else {
      throw Exception('레시피 생성 실패: ${response.statusCode}');
    }
  }

  /// 레시피 삭제
  Future<void> deleteRecipe(String id, String userId) async {
    if (kDebugMode) {
      print('🗑️ Deleting recipe: $id');
    }

    final response = await _apiClient.dio.delete('/recipes/$id');

    if (response.statusCode == 200) {
      if (kDebugMode) {
        print('✅ Recipe deleted: $id');
      }
    } else {
      throw Exception('레시피 삭제 실패: ${response.statusCode}');
    }
  }

  /// presign + PUT 업로드를 통해 썸네일/스텝 이미지 업로드 후 경로 반환
  Future<String> uploadImageWithPresign({
    required String contentType,
    required Uint8List bytes,
  }) async {
    // Use direct endpoint through ApiClient to avoid extra service dependency here
    final presignRes = await _apiClient.dio.post(
      '/media/presign',
      data: {'contentType': contentType},
    );
    if (presignRes.statusCode != 200 && presignRes.statusCode != 201) {
      throw Exception('Presign failed: ${presignRes.statusCode}');
    }
    final data = presignRes.data is Map<String, dynamic>
        ? presignRes.data
        : (presignRes.data['data'] ?? presignRes.data);
    final uploadUrl = (data['uploadUrl'] ?? data['url']) as String;
    final path = (data['path'] ?? data['key']) as String;

    final dio = Dio();
    await dio.put(
      uploadUrl,
      data: Stream.fromIterable(bytes.map((b) => [b])),
      options: Options(
        headers: {'Content-Type': contentType},
        followRedirects: false,
        validateStatus: (code) => code != null && code >= 200 && code < 400,
      ),
    );
    return path;
  }

  /// 다중 이미지 presign 업로드 helper
  Future<List<String>> uploadMultipleWithPresign({
    required String contentType,
    required List<Uint8List> images,
  }) async {
    final paths = <String>[];
    for (final bytes in images) {
      final path = await uploadImageWithPresign(
        contentType: contentType,
        bytes: bytes,
      );
      paths.add(path);
    }
    return paths;
  }

  /// 홈 화면 추천 레시피 조회 (더미 데이터 - 추후 API 구현 필요)
  Future<List<RecipeModel>> getRecommendedRecipes(String? userId) async {
    if (kDebugMode) {
      print('🏠 Fetching recommended recipes for user: $userId');
    }

    // TODO: 실제 추천 API 구현 필요
    // 현재는 피드에서 일부 데이터를 가져와서 추천으로 사용
    try {
      final query = const RecipeQuery(page: 1, limit: 6);
      final feedResult = await getFeed(query, userId);
      return feedResult.recipes.cast<RecipeModel>();
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Using mock recommended recipes due to: $e');
      }
      return _getMockRecommendedRecipes();
    }
  }

  /// 레시피 좋아요/취소 (더미 구현 - 추후 API 구현 필요)
  Future<void> toggleLike(String recipeId, String userId) async {
    if (kDebugMode) {
      print('❤️ Toggle like for recipe: $recipeId by user: $userId');
    }

    // TODO: 실제 좋아요 API 구현 필요
    await Future.delayed(const Duration(milliseconds: 500));

    if (kDebugMode) {
      print('✅ Like toggled successfully');
    }
  }

  /// 레시피 저장/취소 (더미 구현 - 추후 API 구현 필요)
  Future<void> toggleSave(String recipeId, String userId) async {
    if (kDebugMode) {
      print('💾 Toggle save for recipe: $recipeId by user: $userId');
    }

    // TODO: 실제 저장 API 구현 필요
    await Future.delayed(const Duration(milliseconds: 500));

    if (kDebugMode) {
      print('✅ Save toggled successfully');
    }
  }

  /// Recipe to CreateDto 변환 (즉시 공개용 DTO와 서버의 CreateRecipeDto에 맞춤)
  Map<String, dynamic> _recipeToCreateDto(Recipe recipe) {
    return {
      'title': recipe.title,
      'description': recipe.description,
      'ingredients': recipe.ingredients ?? '',
      if (recipe.cookingTime != null) 'cookingTime': recipe.cookingTime,
      if (recipe.servings != null) 'servings': recipe.servings,
      if (recipe.difficulty != null) 'difficulty': recipe.difficulty!.value,
      if (recipe.thumbnailUrl != null) 'thumbnailPath': recipe.thumbnailUrl,
      if (recipe.steps.isNotEmpty)
        'steps': recipe.steps
            .map((step) => {
                  'order': step.order,
                  'description': step.description,
                  if (step.imageUrl != null) 'imagePath': step.imageUrl,
                })
            .toList(),
      if (recipe.tags.isNotEmpty)
        'tags': recipe.tags
            .map((tag) => {
                  'name': tag.name,
                  if (tag.emoji != null) 'emoji': tag.emoji,
                })
            .toList(),
    };
  }

  // removed update dto

  /// Mock 추천 레시피 데이터
  List<RecipeModel> _getMockRecommendedRecipes() {
    final now = DateTime.now();

    return [
      RecipeModel(
        id: 'mock_rec_1',
        title: '레몬 고소 부타',
        description: '일본식 고소한 돼지고기 요리',
        status: RecipeStatus.published,
        createdAt: now.subtract(const Duration(days: 1)),
        updatedAt: now.subtract(const Duration(days: 1)),
        cookingTime: 30,
        servings: 2,
        difficulty: RecipeDifficulty.easy,
        viewCount: 125,
        likesCount: 24,
        commentsCount: 8,
        thumbnailUrl: 'assets/images/remon_pepper_porkloin_00.png',
        author: const AuthorModel(
          id: 'mock_author_1',
          nickname: '요리사 미우',
          profileImage: 'assets/images/miu_profile.png',
        ),
        tags: const [
          RecipeTagModel(name: '오사카 요리', emoji: '🇯🇵'),
          RecipeTagModel(name: '돼지고기', emoji: '🐷'),
        ],
        isLiked: false,
        isSaved: false,
      ),
      RecipeModel(
        id: 'mock_rec_2',
        title: '크림 파스타',
        description: '부드럽고 진한 크림 파스타',
        status: RecipeStatus.published,
        createdAt: now.subtract(const Duration(days: 2)),
        updatedAt: now.subtract(const Duration(days: 2)),
        cookingTime: 25,
        servings: 2,
        difficulty: RecipeDifficulty.medium,
        viewCount: 89,
        likesCount: 17,
        commentsCount: 5,
        thumbnailUrl: 'assets/images/03_pasta_00.png',
        author: const AuthorModel(
          id: 'mock_author_2',
          nickname: '요리사 티모',
          profileImage: 'assets/images/timo_profile.png',
        ),
        tags: const [
          RecipeTagModel(name: '파스타', emoji: '🍝'),
          RecipeTagModel(name: '크림', emoji: '🥛'),
        ],
        isLiked: false,
        isSaved: false,
      ),
    ];
  }
}
