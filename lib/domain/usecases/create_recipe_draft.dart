import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../entities/recipe.dart';
import '../repositories/recipe_repository.dart';

class CreateRecipeDraft {
  final RecipeRepository _repository;

  CreateRecipeDraft(this._repository);

  Future<Either<Failure, Recipe>> call(Recipe recipe, String userId) async {
    return await _repository.createDraft(recipe, userId);
  }
}
