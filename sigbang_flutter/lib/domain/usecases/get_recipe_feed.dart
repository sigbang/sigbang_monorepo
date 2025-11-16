import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../entities/recipe_query.dart';
import '../repositories/recipe_repository.dart';

class GetRecipeFeed {
  final RecipeRepository _repository;

  GetRecipeFeed(this._repository);

  Future<Either<Failure, PaginatedRecipes>> call(
    RecipeQuery query,
    String? userId,
  ) async {
    return await _repository.getFeed(query, userId);
  }
}
