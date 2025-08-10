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

  // 레시피 임시 저장 생성
  Future<Either<Failure, Recipe>> createDraft(Recipe recipe, String userId);

  // 레시피 임시 저장 수정
  Future<Either<Failure, Recipe>> updateDraft(
    String id,
    Recipe recipe,
    String userId,
  );

  // 레시피 공개
  Future<Either<Failure, Recipe>> publishRecipe(String id, String userId);
  

  // 단일 임시 저장 조회 (사용자당 하나)
  Future<Either<Failure, Recipe>> getDraft(String userId);

  // 레시피 삭제
  Future<Either<Failure, void>> deleteRecipe(String id, String userId);

  // 레시피 대표 이미지 업로드
  Future<Either<Failure, String>> uploadThumbnail(
    String id,
    String userId,
    String filePath,
  );

  // 레시피 이미지 업로드 (단계별 이미지용)
  Future<Either<Failure, List<String>>> uploadImages(
    String userId,
    List<String> filePaths,
  );

  // 홈 화면 추천 레시피 조회 (추후 구현)
  Future<Either<Failure, List<Recipe>>> getRecommendedRecipes(String? userId);

  // 레시피 좋아요/취소
  Future<Either<Failure, void>> toggleLike(String recipeId, String userId);

  // 레시피 저장/취소
  Future<Either<Failure, void>> toggleSave(String recipeId, String userId);
}
