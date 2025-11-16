import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../entities/recipe_query.dart';
import '../repositories/recipe_repository.dart';

class GetMySavedRecipes {
  final RecipeRepository _repository;
  const GetMySavedRecipes(this._repository);

  Future<Either<Failure, PaginatedRecipes>> call({
    required int limit,
    String? cursor,
  }) {
    return _repository.getMySavedRecipes(limit: limit, cursor: cursor);
  }
}
