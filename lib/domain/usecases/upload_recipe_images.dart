import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../repositories/recipe_repository.dart';

class UploadRecipeImages {
  final RecipeRepository _repository;

  UploadRecipeImages(this._repository);

  Future<Either<Failure, List<String>>> call(
    String userId,
    List<String> filePaths,
  ) async {
    return await _repository.uploadImages(userId, filePaths);
  }
}
