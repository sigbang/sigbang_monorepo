import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../entities/recipe.dart';
import '../repositories/recipe_repository.dart';

class GetMyDraft {
  final RecipeRepository _repository;
  GetMyDraft(this._repository);

  Future<Either<Failure, Recipe>> call(String userId) async {
    return await _repository.getDraft(userId);
  }
}
