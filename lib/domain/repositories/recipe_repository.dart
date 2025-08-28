import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../entities/recipe.dart';
import '../entities/recipe_query.dart';

abstract class RecipeRepository {
  // 피드 조회 (공개된 레시피)
  Future<Either<Failure, PaginatedRecipes>> getFeed(
    RecipeQuery query,
    String? userId,
  );

  // 레시피 상세 조회
  Future<Either<Failure, Recipe>> getRecipe(String id, String? userId);

  // 레시피 즉시 생성(공개)
  Future<Either<Failure, String>> createRecipe(Recipe recipe);

  // 레시피 수정
  Future<Either<Failure, void>> updateRecipe(Recipe recipe);

  // 레시피 삭제
  Future<Either<Failure, void>> deleteRecipe(String id, String userId);

  // presign 업로드 (썸네일/스텝)
  Future<Either<Failure, String>> uploadImageWithPresign({
    required String contentType,
    required List<int> bytes,
  });

  // 홈 화면 추천 레시피 조회 (추후 구현)
  Future<Either<Failure, List<Recipe>>> getRecommendedRecipes(String? userId);

  // 인기 레시피 (커서 기반)
  Future<Either<Failure, PaginatedRecipes>> getPopularRecipes({
    required int limit,
    String? cursor,
  });

  // 추천 레시피 피드 (커서 기반)
  Future<Either<Failure, PaginatedRecipes>> getRecommendedFeed({
    required int limit,
    String? cursor,
  });

  // 레시피 좋아요/취소
  Future<Either<Failure, void>> toggleLike(String recipeId, String userId);

  // 레시피 저장/취소
  Future<Either<Failure, void>> toggleSave(String recipeId, String userId);

  // 내 레시피 목록 (커서 기반)
  Future<Either<Failure, PaginatedRecipes>> getMyRecipes({
    required int limit,
    String? cursor,
  });

  // 내가 저장한 레시피 목록 (커서 기반)
  Future<Either<Failure, PaginatedRecipes>> getMySavedRecipes({
    required int limit,
    String? cursor,
  });
}
