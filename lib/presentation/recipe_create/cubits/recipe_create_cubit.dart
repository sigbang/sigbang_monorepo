import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter/foundation.dart';
import '../../../domain/entities/recipe.dart';
import '../../../domain/usecases/create_recipe_draft.dart';
import '../../../domain/usecases/publish_recipe.dart';

import '../../../domain/usecases/upload_recipe_images.dart';
import '../../../domain/usecases/get_current_user.dart';
import 'recipe_create_state.dart';

class RecipeCreateCubit extends Cubit<RecipeCreateState> {
  final CreateRecipeDraft _createRecipeDraft;
  final PublishRecipe _publishRecipe;
  final UploadRecipeImages _uploadThumbnail;
  final UploadRecipeImages _uploadImages;
  final GetCurrentUser _getCurrentUser;

  RecipeCreateCubit(
    this._createRecipeDraft,
    this._publishRecipe,
    this._uploadThumbnail,
    this._uploadImages,
    this._getCurrentUser,
  ) : super(RecipeCreateInitial());

  /// 편집 모드로 전환
  void startEditing() {
    if (state is! RecipeCreateEditing) {
      emit(const RecipeCreateEditing());
    }
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
    }
  }

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
      steps.removeAt(index);

      // 순서 재정렬
      for (int i = 0; i < steps.length; i++) {
        steps[i] = steps[i].copyWith(order: i + 1);
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
    }
  }

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

  /// 임시 저장
  Future<void> saveDraft() async {
    final currentState = state;
    if (currentState is! RecipeCreateEditing) return;

    try {
      // 기본 유효성 검사
      if (currentState.title.trim().isEmpty) {
        emit(RecipeCreateError(
          message: '제목을 입력해주세요',
          previousState: currentState,
        ));
        return;
      }

      emit(RecipeCreateUploading(
        title: currentState.title,
        description: currentState.description,
        ingredients: currentState.ingredients,
        steps: currentState.steps,
        cookingTime: currentState.cookingTime,
        servings: currentState.servings,
        difficulty: currentState.difficulty,
        tags: currentState.tags,
        thumbnailPath: currentState.thumbnailPath,
        currentStep: '임시 저장 중...',
        progress: 0.5,
      ));

      // 사용자 확인
      final userResult = await _getCurrentUser();
      final userId = userResult.fold(
        (failure) => throw Exception('로그인이 필요합니다'),
        (user) => user?.id ?? 'anonymous',
      );

      // 레시피 객체 생성
      final recipe = Recipe(
        id: '', // 서버에서 생성
        title: currentState.title,
        description: currentState.description,
        ingredients: currentState.ingredients,
        steps: currentState.steps,
        cookingTime: currentState.cookingTime,
        servings: currentState.servings,
        difficulty: currentState.difficulty,
        status: RecipeStatus.draft,
        tags: currentState.tags,
        thumbnailUrl: currentState.thumbnailPath,
        viewCount: 0,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        isSaved: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        author: null, // 서버에서 설정
      );

      // 임시 저장 API 호출
      final result = await _createRecipeDraft(recipe, userId);

      result.fold(
        (failure) {
          if (kDebugMode) {
            print('❌ Draft save failed: ${failure.toString()}');
          }
          emit(RecipeCreateError(
            message: '임시 저장에 실패했습니다',
            previousState: currentState,
          ));
        },
        (savedRecipe) {
          if (kDebugMode) {
            print('✅ Draft saved: ${savedRecipe.id}');
          }
          emit(RecipeCreateSuccess(recipe: savedRecipe));
        },
      );
    } catch (e) {
      if (kDebugMode) {
        print('❌ Draft save error: $e');
      }
      emit(RecipeCreateError(
        message: '임시 저장 중 오류가 발생했습니다',
        previousState: currentState,
      ));
    }
  }

  /// 발행 (공개)
  Future<void> publishRecipe() async {
    final currentState = state;
    if (currentState is! RecipeCreateEditing) return;

    try {
      // 필수 항목 검사
      final validationErrors = _validateForPublish(currentState);
      if (validationErrors.isNotEmpty) {
        emit(currentState.copyWith(errors: validationErrors));
        return;
      }

      emit(RecipeCreateUploading(
        title: currentState.title,
        description: currentState.description,
        ingredients: currentState.ingredients,
        steps: currentState.steps,
        cookingTime: currentState.cookingTime,
        servings: currentState.servings,
        difficulty: currentState.difficulty,
        tags: currentState.tags,
        thumbnailPath: currentState.thumbnailPath,
        currentStep: '발행 준비 중...',
        progress: 0.2,
      ));

      // 먼저 임시 저장
      await saveDraft();

      final successState = state;
      if (successState is! RecipeCreateSuccess) return;

      emit(RecipeCreateUploading(
        title: currentState.title,
        description: currentState.description,
        ingredients: currentState.ingredients,
        steps: currentState.steps,
        cookingTime: currentState.cookingTime,
        servings: currentState.servings,
        difficulty: currentState.difficulty,
        tags: currentState.tags,
        thumbnailPath: currentState.thumbnailPath,
        currentStep: '레시피 발행 중...',
        progress: 0.8,
      ));

      // 사용자 확인
      final userResult = await _getCurrentUser();
      final userId = userResult.fold(
        (failure) => throw Exception('로그인이 필요합니다'),
        (user) => user?.id ?? 'anonymous',
      );

      // 발행 API 호출
      final publishResult =
          await _publishRecipe(successState.recipe.id, userId);

      publishResult.fold(
        (failure) {
          if (kDebugMode) {
            print('❌ Publish failed: ${failure.toString()}');
          }
          emit(RecipeCreateError(
            message: '레시피 발행에 실패했습니다',
            previousState: currentState,
          ));
        },
        (publishedRecipe) {
          if (kDebugMode) {
            print('✅ Recipe published: ${publishedRecipe.id}');
          }
          emit(RecipeCreateSuccess(recipe: publishedRecipe));
        },
      );
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

  /// 발행용 유효성 검사
  Map<String, String?> _validateForPublish(RecipeCreateEditing state) {
    final errors = <String, String?>{};

    if (state.title.trim().isEmpty) {
      errors['title'] = '제목을 입력해주세요';
    }
    if (state.description.trim().isEmpty) {
      errors['description'] = '설명을 입력해주세요';
    }
    if (state.ingredients.trim().isEmpty) {
      errors['ingredients'] = '재료를 입력해주세요';
    }
    if (state.steps.isEmpty) {
      errors['steps'] = '조리 과정을 추가해주세요';
    } else {
      for (int i = 0; i < state.steps.length; i++) {
        if (state.steps[i].description.trim().isEmpty) {
          errors['step_$i'] = '${i + 1}단계 설명을 입력해주세요';
          break;
        }
      }
    }
    if (state.thumbnailPath == null) {
      errors['thumbnail'] = '대표 이미지를 선택해주세요';
    }

    return errors;
  }

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
