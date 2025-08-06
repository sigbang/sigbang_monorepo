import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../entities/recipe.dart';
import '../repositories/recipe_repository.dart';

class UpdateRecipeDraft {
  final RecipeRepository _repository;

  UpdateRecipeDraft(this._repository);

  Future<Either<Failure, Recipe>> call(
    String id,
    Recipe recipe,
    String userId,
  ) async {
    return await _repository.updateDraft(id, recipe, userId);
  }
}
