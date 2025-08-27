import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../repositories/recipe_repository.dart';

class ToggleLike {
  final RecipeRepository _repository;

  ToggleLike(this._repository);

  Future<Either<Failure, void>> call({
    required String recipeId,
    required String userId,
  }) async {
    return await _repository.toggleLike(recipeId, userId);
  }
}
