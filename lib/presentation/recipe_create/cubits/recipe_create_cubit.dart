import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';
import '../../../domain/entities/recipe.dart';
import '../../../domain/usecases/create_recipe.dart';

// import '../../../domain/usecases/upload_recipe_images.dart';
import '../../../domain/usecases/upload_image_with_presign.dart';
import 'recipe_create_state.dart';

class RecipeCreateCubit extends Cubit<RecipeCreateState> {
  final CreateRecipe _createRecipe;
  final UploadImageWithPresign _uploadImageWithPresign;
  // Optionally used for uploading images later
  // final UploadRecipeThumbnail _uploadRecipeThumbnail;

  RecipeCreateCubit(
    this._createRecipe,
    this._uploadImageWithPresign,
  ) : super(RecipeCreateInitial());

  /// 진입 시 빈 편집 모드 전환 (임시저장 제거)
  Future<void> startEditing() async {
    if (state is RecipeCreateEditing) return;
    emit(RecipeCreateEditing(
      steps: const [
        RecipeStep(order: 1, description: '', imageUrl: null),
      ],
    ));
  }

  /// 제목 변경
  void updateTitle(String title) {
    final currentState = state;
    if (currentState is RecipeCreateEditing) {
      final errors = Map<String, String?>.from(currentState.errors);

      // 제목 유효성 검사
      if (title.trim().isEmpty) {
        errors['title'] = '제목을 입력해주세요';
      } else if (title.trim().length < 3) {
        errors['title'] = '제목은 3자 이상 입력해주세요';
      } else {
        errors.remove('title');
      }

      emit(currentState.copyWith(
        title: title,
        isDirty: true,
        errors: errors,
      ));
    }
  }

  /// 설명 변경
  void updateDescription(String description) {
    final currentState = state;
    if (currentState is RecipeCreateEditing) {
      final errors = Map<String, String?>.from(currentState.errors);

      if (description.trim().isEmpty) {
        errors['description'] = '설명을 입력해주세요';
      } else if (description.trim().length < 10) {
        errors['description'] = '설명은 10자 이상 입력해주세요';
      } else {
        errors.remove('description');
      }

      emit(currentState.copyWith(
        description: description,
        isDirty: true,
        errors: errors,
      ));
    }
  }

  /// 재료 변경
  void updateIngredients(String ingredients) {
    final currentState = state;
    if (currentState is RecipeCreateEditing) {
      final errors = Map<String, String?>.from(currentState.errors);

      if (ingredients.trim().isEmpty) {
        errors['ingredients'] = '재료를 입력해주세요';
      } else {
        errors.remove('ingredients');
      }

      emit(currentState.copyWith(
        ingredients: ingredients,
        isDirty: true,
        errors: errors,
      ));
    }
  }

  /// 조리 시간 변경
  void updateCookingTime(int cookingTime) {
    final currentState = state;
    if (currentState is RecipeCreateEditing) {
      emit(currentState.copyWith(
        cookingTime: cookingTime,
        isDirty: true,
      ));
    }
  }

  /// 인분 수 변경
  void updateServings(int servings) {
    final currentState = state;
    if (currentState is RecipeCreateEditing) {
      emit(currentState.copyWith(
        servings: servings,
        isDirty: true,
      ));
    }
  }

  /// 난이도 변경
  void updateDifficulty(RecipeDifficulty difficulty) {
    final currentState = state;
    if (currentState is RecipeCreateEditing) {
      emit(currentState.copyWith(
        difficulty: difficulty,
        isDirty: true,
      ));
    }
  }

  /// 링크 이름 변경
  void updateLinkName(String name) {
    final currentState = state;
    if (currentState is RecipeCreateEditing) {
      emit(currentState.copyWith(
        linkName: name,
        isDirty: true,
      ));
    }
  }

  /// 링크 주소 변경
  void updateLinkUrl(String url) {
    final currentState = state;
    if (currentState is RecipeCreateEditing) {
      final errors = Map<String, String?>.from(currentState.errors);
      if (url.isNotEmpty) {
        final parsed = Uri.tryParse(url);
        if (parsed == null ||
            (!parsed.isScheme('http') && !parsed.isScheme('https'))) {
          errors['linkUrl'] = '올바른 URL을 입력해주세요';
        } else {
          errors.remove('linkUrl');
        }
      } else {
        errors.remove('linkUrl');
      }

      emit(currentState.copyWith(
        linkUrl: url,
        isDirty: true,
        errors: errors,
      ));
    }
  }

  /// 태그 추가/제거
  void toggleTag(RecipeTag tag) {
    final currentState = state;
    if (currentState is RecipeCreateEditing) {
      final tags = List<RecipeTag>.from(currentState.tags);

      if (tags.any((t) => t.name == tag.name)) {
        tags.removeWhere((t) => t.name == tag.name);
      } else {
        tags.add(tag);
      }

      emit(currentState.copyWith(
        tags: tags,
        isDirty: true,
      ));
    }
  }

  /// 썸네일 이미지 설정
  void setThumbnail(String imagePath) {
    final currentState = state;
    if (currentState is RecipeCreateEditing) {
      final errors = Map<String, String?>.from(currentState.errors);
      errors.remove('thumbnail');

      emit(currentState.copyWith(
        thumbnailPath: imagePath,
        isDirty: true,
        errors: errors,
      ));

      if (kDebugMode) {
        print('📸 Thumbnail set: $imagePath');
      }

      // no-op: presign upload will happen on publish
    }
  }

  // removed background upload

  /// 단계 추가
  void addStep() {
    final currentState = state;
    if (currentState is RecipeCreateEditing) {
      final steps = List<RecipeStep>.from(currentState.steps);
      steps.add(RecipeStep(
        order: steps.length + 1,
        description: '',
        imageUrl: null,
      ));

      emit(currentState.copyWith(
        steps: steps,
        isDirty: true,
      ));

      if (kDebugMode) {
        print('➕ Added step ${steps.length}');
      }
    }
  }

  /// 단계 삭제
  void removeStep(int index) {
    final currentState = state;
    if (currentState is RecipeCreateEditing &&
        index < currentState.steps.length) {
      final steps = List<RecipeStep>.from(currentState.steps);

      // 마지막 1개를 삭제하려고 하면 빈 1단계로 초기화
      if (steps.length == 1) {
        steps[0] = const RecipeStep(order: 1, description: '', imageUrl: null);
      } else {
        steps.removeAt(index);
        // 순서 재정렬
        for (int i = 0; i < steps.length; i++) {
          steps[i] = steps[i].copyWith(order: i + 1);
        }
      }

      emit(currentState.copyWith(
        steps: steps,
        isDirty: true,
      ));

      if (kDebugMode) {
        print('🗑️ Removed step ${index + 1}');
      }
    }
  }

  /// 단계 설명 변경
  void updateStepDescription(int index, String description) {
    final currentState = state;
    if (currentState is RecipeCreateEditing &&
        index < currentState.steps.length) {
      final steps = List<RecipeStep>.from(currentState.steps);
      steps[index] = steps[index].copyWith(description: description);

      emit(currentState.copyWith(
        steps: steps,
        isDirty: true,
      ));
    }
  }

  /// 단계 이미지 설정
  void setStepImage(int index, String imagePath) {
    final currentState = state;
    if (currentState is RecipeCreateEditing &&
        index < currentState.steps.length) {
      final steps = List<RecipeStep>.from(currentState.steps);
      steps[index] = steps[index].copyWith(imageUrl: imagePath);

      emit(currentState.copyWith(
        steps: steps,
        isDirty: true,
      ));

      if (kDebugMode) {
        print('📸 Step ${index + 1} image set: $imagePath');
      }

      // no-op: presign upload will happen on publish
    }
  }

  // removed background upload

  /// 단계 순서 변경
  void reorderSteps(int oldIndex, int newIndex) {
    final currentState = state;
    if (currentState is RecipeCreateEditing) {
      final steps = List<RecipeStep>.from(currentState.steps);

      if (newIndex > oldIndex) {
        newIndex -= 1;
      }

      final item = steps.removeAt(oldIndex);
      steps.insert(newIndex, item);

      // 순서 재정렬
      for (int i = 0; i < steps.length; i++) {
        steps[i] = steps[i].copyWith(order: i + 1);
      }

      emit(currentState.copyWith(
        steps: steps,
        isDirty: true,
      ));

      if (kDebugMode) {
        print('🔄 Reordered steps: $oldIndex -> $newIndex');
      }
    }
  }

  // removed draft save

  // no-op

  /// AI 생성 목업: 기본 샘플 데이터로 폼 채우기
  void generateWithAiMock() {
    final currentState = state;
    if (currentState is RecipeCreateEditing) {
      emit(currentState.copyWith(
        title:
            currentState.title.isEmpty ? 'AI가 제안한 김치볶음밥' : currentState.title,
        description: currentState.description.isEmpty
            ? '간단하고 맛있는 김치볶음밥 레시피입니다.'
            : currentState.description,
        ingredients: currentState.ingredients.isEmpty
            ? '- 밥 1공기\n- 김치 1컵\n- 돼지고기 100g\n- 대파 1/2대\n- 식용유 1큰술\n- 간장 1큰술\n- 고춧가루 1작은술'
            : currentState.ingredients,
        steps: currentState.steps.isEmpty
            ? [
                const RecipeStep(
                    order: 1, description: '팬에 기름을 두르고 파를 볶아 향을 낸다.'),
                const RecipeStep(
                    order: 2, description: '돼지고기와 김치를 넣고 충분히 볶는다.'),
                const RecipeStep(
                    order: 3, description: '밥과 간장을 넣고 골고루 섞으며 볶는다.'),
              ]
            : currentState.steps,
        cookingTime:
            currentState.cookingTime == 0 ? 20 : currentState.cookingTime,
        isDirty: true,
      ));
    }
  }

  /// 발행 (즉시 생성/공개)
  Future<void> publishRecipe() async {
    final currentState = state;
    if (currentState is! RecipeCreateEditing) return;

    try {
      // 비어있는 필드는 기본값으로 채움
      final filledTitle = currentState.title.trim().isEmpty
          ? '제목 없는 레시피'
          : currentState.title.trim();
      final filledDescription = currentState.description.trim().isEmpty
          ? '설명이 없어 기본 문구로 대체되었습니다.'
          : currentState.description.trim();
      final filledIngredients = currentState.ingredients.trim().isEmpty
          ? '- 재료 정보를 입력하지 않았습니다.'
          : currentState.ingredients.trim();
      final filledSteps = currentState.steps.isEmpty
          ? [
              const RecipeStep(
                  order: 1, description: '조리 과정을 작성하지 않았습니다.', imageUrl: null),
            ]
          : currentState.steps;

      // 썸네일은 여전히 필수
      final validationErrors = <String, String?>{};
      if (currentState.thumbnailPath == null) {
        validationErrors['thumbnail'] = '대표 이미지를 선택해주세요';
      }
      if (validationErrors.isNotEmpty) {
        emit(currentState.copyWith(
          errors: validationErrors,
          title: filledTitle,
          description: filledDescription,
          ingredients: filledIngredients,
          steps: filledSteps,
        ));
        return;
      }

      emit(RecipeCreateUploading(
        title: filledTitle,
        description: filledDescription,
        ingredients: filledIngredients,
        steps: filledSteps,
        cookingTime: currentState.cookingTime,
        servings: currentState.servings,
        difficulty: currentState.difficulty,
        tags: currentState.tags,
        linkName: currentState.linkName,
        linkUrl: currentState.linkUrl,
        thumbnailPath: currentState.thumbnailPath,
        currentStep: '이미지 업로드 준비 중...',
        progress: 0.1,
      ));

      // Upload thumbnail if needed
      String? uploadedThumbnailPath = currentState.thumbnailPath;
      if (uploadedThumbnailPath != null &&
          uploadedThumbnailPath.isNotEmpty &&
          !_isRemoteUrl(uploadedThumbnailPath)) {
        final bytes = await File(uploadedThumbnailPath).readAsBytes();
        final res = await _uploadImageWithPresign(
          contentType: _detectMimeType(uploadedThumbnailPath),
          bytes: bytes,
        );
        final path = res.fold<String?>((_) => null, (p) => p);
        if (path == null) {
          emit(RecipeCreateError(
            message: '대표 이미지 업로드에 실패했습니다',
            previousState: currentState,
          ));
          return;
        }
        uploadedThumbnailPath = path;
      }

      // Upload step images if needed
      final uploadedSteps = <RecipeStep>[];
      for (final s in filledSteps) {
        String? img = s.imageUrl;
        if (img != null && img.isNotEmpty && !_isRemoteUrl(img)) {
          final bytes = await File(img).readAsBytes();
          final res = await _uploadImageWithPresign(
            contentType: _detectMimeType(img),
            bytes: bytes,
          );
          final path = res.fold<String?>((_) => null, (p) => p);
          if (path == null) {
            emit(RecipeCreateError(
              message: '단계 이미지 업로드에 실패했습니다',
              previousState: currentState,
            ));
            return;
          }
          img = path;
        }
        uploadedSteps.add(s.copyWith(imageUrl: img));
      }

      emit(RecipeCreateUploading(
        title: filledTitle,
        description: filledDescription,
        ingredients: filledIngredients,
        steps: uploadedSteps,
        cookingTime: currentState.cookingTime,
        servings: currentState.servings,
        difficulty: currentState.difficulty,
        tags: currentState.tags,
        linkName: currentState.linkName,
        linkUrl: currentState.linkUrl,
        thumbnailPath: uploadedThumbnailPath,
        currentStep: '레시피 발행 중...',
        progress: 0.8,
      ));

      final recipe = Recipe(
        id: '',
        title: filledTitle,
        description: filledDescription,
        ingredients: filledIngredients,
        steps: uploadedSteps,
        cookingTime: currentState.cookingTime,
        servings: currentState.servings,
        difficulty: currentState.difficulty,
        status: RecipeStatus.published,
        tags: currentState.tags,
        thumbnailUrl: uploadedThumbnailPath,
        viewCount: 0,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        isSaved: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        author: null,
      );

      final result = await _createRecipe(recipe);
      result.fold((failure) {
        if (kDebugMode) {
          print('❌ Create failed: ${failure.toString()}');
        }
        emit(RecipeCreateError(
          message: '레시피 발행에 실패했습니다',
          previousState: currentState,
        ));
      }, (createdId) {
        if (kDebugMode) {
          print('✅ Recipe created: $createdId');
        }
        emit(RecipeCreateSuccess(recipeId: createdId));
      });
    } catch (e) {
      if (kDebugMode) {
        print('❌ Publish error: $e');
      }
      emit(RecipeCreateError(
        message: '레시피 발행 중 오류가 발생했습니다',
        previousState: currentState,
      ));
    }
  }

  bool _isRemoteUrl(String path) {
    return path.startsWith('http://') || path.startsWith('https://');
  }

  String _detectMimeType(String path) {
    final lower = path.toLowerCase();
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.png')) return 'image/png';
    return 'image/jpeg';
  }

  // 기존의 상세 유효성 검사는 기본값 자동 채우기로 대체됨

  /// 에러에서 복구
  void recoverFromError() {
    final currentState = state;
    if (currentState is RecipeCreateError &&
        currentState.previousState != null) {
      emit(currentState.previousState!);
    }
  }

  /// 초기화
  void reset() {
    emit(RecipeCreateInitial());
  }
}
