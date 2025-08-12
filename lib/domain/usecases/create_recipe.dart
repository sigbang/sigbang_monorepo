import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../entities/recipe.dart';
import '../repositories/recipe_repository.dart';

class CreateRecipe {
  final RecipeRepository _repository;

  CreateRecipe(this._repository);

  Future<Either<Failure, Recipe>> call(Recipe recipe) async {
    return await _repository.createRecipe(recipe);
  }
}
