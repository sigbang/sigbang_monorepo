import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../repositories/recipe_repository.dart';

class UploadRecipeThumbnail {
  final RecipeRepository _repository;

  UploadRecipeThumbnail(this._repository);

  Future<Either<Failure, String>> call(
    String recipeId,
    String userId,
    String filePath,
  ) async {
    return await _repository.uploadThumbnail(recipeId, userId, filePath);
  }
}
