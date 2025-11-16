import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../entities/recipe_query.dart';
import '../repositories/recipe_repository.dart';

class SearchRecipes {
  final RecipeRepository _repository;

  SearchRecipes(this._repository);

  Future<Either<Failure, PaginatedRecipes>> call({
    required String query,
    required int limit,
    String? cursor,
  }) async {
    return await _repository.searchRecipes(
      query: query,
      limit: limit,
      cursor: cursor,
    );
  }
}
