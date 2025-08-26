import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../repositories/recipe_repository.dart';

class DeleteRecipe {
  final RecipeRepository _repository;

  DeleteRecipe(this._repository);

  Future<Either<Failure, void>> call({
    required String id,
    required String userId,
  }) async {
    return await _repository.deleteRecipe(id, userId);
  }
}

