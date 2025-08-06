import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../entities/recipe.dart';
import '../repositories/recipe_repository.dart';

class GetRecipeDetail {
  final RecipeRepository _repository;

  GetRecipeDetail(this._repository);

  Future<Either<Failure, Recipe>> call(String id, String? userId) async {
    return await _repository.getRecipe(id, userId);
  }
}
