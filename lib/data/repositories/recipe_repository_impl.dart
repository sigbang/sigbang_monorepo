import 'package:dartz/dartz.dart';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import '../../core/errors/failure.dart';
import '../../domain/entities/recipe.dart';
import '../../domain/entities/recipe_query.dart';
import '../../domain/repositories/recipe_repository.dart';
import '../datasources/recipe_service.dart';

class RecipeRepositoryImpl implements RecipeRepository {
  final RecipeService _recipeService;

  RecipeRepositoryImpl(this._recipeService);

  @override
  Future<Either<Failure, PaginatedRecipes>> getFeed(
    RecipeQuery query,
    String? userId,
  ) async {
    try {
      final result = await _recipeService.getFeed(query, userId);
      return Right(result.toDomain());
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Recipe>> getRecipe(String id, String? userId) async {
    try {
      final result = await _recipeService.getRecipe(id, userId);
      return Right(result.toDomain());
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return const Left(NotFoundFailure(message: '레시피를 찾을 수 없습니다'));
      } else if (e.response?.statusCode == 403) {
        return const Left(ForbiddenFailure(message: '접근 권한이 없습니다'));
      }
      return Left(ServerFailure(message: e.toString()));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  // Removed draft flow

  // Removed draft flow

  // Removed draft flow

  // Removed draft flow

  @override
  Future<Either<Failure, void>> deleteRecipe(String id, String userId) async {
    try {
      await _recipeService.deleteRecipe(id, userId);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  // Removed old thumbnail multipart flow

  // Removed old batch image upload

  @override
  Future<Either<Failure, List<Recipe>>> getRecommendedRecipes(
      String? userId) async {
    try {
      final result = await _recipeService.getRecommendedRecipes(userId);
      return Right(result.map((r) => r.toDomain()).toList());
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, PaginatedRecipes>> getPopularRecipes({
    required int limit,
    String? cursor,
  }) async {
    try {
      final result =
          await _recipeService.getPopular(limit: limit, cursor: cursor);
      return Right(result.toDomain());
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, PaginatedRecipes>> getRecommendedFeed({
    required int limit,
    String? cursor,
  }) async {
    try {
      final result =
          await _recipeService.getRecommended(limit: limit, cursor: cursor);
      return Right(result.toDomain());
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, PaginatedRecipes>> searchRecipes({
    required String query,
    required int limit,
    String? cursor,
  }) async {
    try {
      final result = await _recipeService.searchRecipes(
        query: query,
        limit: limit,
        cursor: cursor,
      );
      return Right(result.toDomain());
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, String>> createRecipe(Recipe recipe) async {
    try {
      final id = await _recipeService.createRecipe(recipe);
      return Right(id);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> updateRecipe(Recipe recipe) async {
    try {
      await _recipeService.updateRecipe(id: recipe.id, recipe: recipe);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, String>> uploadImageWithPresign({
    required String contentType,
    required List<int> bytes,
  }) async {
    try {
      final path = await _recipeService.uploadImageWithPresign(
        contentType: contentType,
        bytes: Uint8List.fromList(bytes),
      );
      return Right(path);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> toggleLike(
      String recipeId, String userId) async {
    try {
      await _recipeService.toggleLike(recipeId, userId);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> toggleSave(
      String recipeId, String userId) async {
    try {
      await _recipeService.toggleSave(recipeId, userId);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, PaginatedRecipes>> getMyRecipes({
    required int limit,
    String? cursor,
  }) async {
    try {
      final result =
          await _recipeService.getMyRecipes(limit: limit, cursor: cursor);
      return Right(result.toDomain());
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, PaginatedRecipes>> getMySavedRecipes({
    required int limit,
    String? cursor,
  }) async {
    try {
      final result =
          await _recipeService.getMySavedRecipes(limit: limit, cursor: cursor);
      return Right(result.toDomain());
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}
