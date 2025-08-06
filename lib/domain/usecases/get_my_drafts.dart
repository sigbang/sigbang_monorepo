import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../entities/recipe_query.dart';
import '../repositories/recipe_repository.dart';

class GetMyDrafts {
  final RecipeRepository _repository;

  GetMyDrafts(this._repository);

  Future<Either<Failure, PaginatedRecipes>> call(
    String userId,
    int page,
    int limit,
  ) async {
    return await _repository.getDrafts(userId, page, limit);
  }
}
