import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../entities/recipe.dart';
import '../repositories/recipe_repository.dart';

class UpdateRecipe {
  final RecipeRepository _repository;

  UpdateRecipe(this._repository);

  Future<Either<Failure, void>> call(Recipe recipe) async {
    return await _repository.updateRecipe(recipe);
  }
}
