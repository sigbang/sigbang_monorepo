import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../entities/recipe.dart';
import '../repositories/recipe_repository.dart';

class GetRecommendedRecipes {
  final RecipeRepository _repository;

  GetRecommendedRecipes(this._repository);

  Future<Either<Failure, List<Recipe>>> call(String? userId) async {
    return await _repository.getRecommendedRecipes(userId);
  }
}
