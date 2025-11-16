import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../entities/recipe.dart';
import '../entities/recipe_query.dart';
import '../repositories/recipe_repository.dart';

class GetRecommendedRecipes {
  final RecipeRepository _repository;

  GetRecommendedRecipes(this._repository);

  Future<Either<Failure, List<Recipe>>> call(String? userId) async {
    // Keep existing behavior for Home header small grid: 6 items
    return await _repository.getRecommendedRecipes(userId);
  }
}

class GetPopularRecipes {
  final RecipeRepository _repository;

  GetPopularRecipes(this._repository);

  Future<Either<Failure, PaginatedRecipes>> call({
    int limit = 10,
    String? cursor,
  }) async {
    return await _repository.getPopularRecipes(limit: limit, cursor: cursor);
  }
}

class GetRecommendedFeedUsecase {
  final RecipeRepository _repository;

  GetRecommendedFeedUsecase(this._repository);

  Future<Either<Failure, PaginatedRecipes>> call({
    int limit = 10,
    String? cursor,
  }) async {
    return await _repository.getRecommendedFeed(limit: limit, cursor: cursor);
  }
}
