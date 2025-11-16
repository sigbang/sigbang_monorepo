import 'package:dartz/dartz.dart';
import '../../core/errors/failure.dart';
import '../repositories/recipe_repository.dart';

class UploadImageWithPresign {
  final RecipeRepository _repository;
  UploadImageWithPresign(this._repository);

  Future<Either<Failure, String>> call({
    required String contentType,
    required List<int> bytes,
  }) async {
    return await _repository.uploadImageWithPresign(
      contentType: contentType,
      bytes: bytes,
    );
  }
}
