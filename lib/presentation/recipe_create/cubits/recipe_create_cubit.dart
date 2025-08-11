import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter/foundation.dart';
import '../../../domain/entities/recipe.dart';
import '../../../domain/usecases/create_recipe_draft.dart';
import '../../../domain/usecases/publish_recipe.dart';

// import '../../../domain/usecases/upload_recipe_images.dart';
import '../../../domain/usecases/get_current_user.dart';
import '../../../domain/usecases/get_my_draft.dart';
import '../../../domain/usecases/update_recipe_draft.dart';
import '../../../domain/usecases/get_recipe_detail.dart';
import 'recipe_create_state.dart';

class RecipeCreateCubit extends Cubit<RecipeCreateState> {
  final CreateRecipeDraft _createRecipeDraft;
  final PublishRecipe _publishRecipe;
  final GetCurrentUser _getCurrentUser;
  final GetMyDraft _getMyDraft;
  final UpdateRecipeDraft _updateRecipeDraft;
  final GetRecipeDetail _getRecipeDetail;

  RecipeCreateCubit(
    this._createRecipeDraft,
    this._publishRecipe,
    this._getCurrentUser,
    this._getMyDraft,
    this._updateRecipeDraft,
    this._getRecipeDetail,
  ) : super(RecipeCreateInitial());

  /// 진입 시 임시 저장 불러오기 후 편집 모드 전환
  Future<void> startEditing() async {
    if (state is RecipeCreateEditing) return;

    // 편집 차단 상태로 진입
    emit(RecipeCreateChecking());

    try {
      // 현재 사용자
      final userResult = await _getCurrentUser();
      final userId = userResult.fold((_) => null, (user) => user?.id);
      if (userId == null) {
        emit(const RecipeCreateEditing());
        return;
      }

      // 단일 임시 저장 조회
      final draftResult = await _getMyDraft(userId);
      await draftResult.fold((failure) async {
        emit(const RecipeCreateEditing());
      }, (draft) async {
        // id로 상세 데이터 갱신 후 폼 채우기
        final detailResult = await _getRecipeDetail(draft.id, userId);
        await detailResult.fold((_) async {
          // 상세 실패 시 드래프트로라도 채움
          final editing = (state is RecipeCreateEditing)
              ? state as RecipeCreateEditing
              : const RecipeCreateEditing();
          emit(editing.copyWith(
            draftId: draft.id,
            title: draft.title,
            description: draft.description,
            ingredients: draft.ingredients ?? editing.ingredients,
            steps: draft.steps,
            cookingTime: draft.cookingTime ?? editing.cookingTime,
            servings: draft.servings ?? editing.servings,
            difficulty: draft.difficulty ?? editing.difficulty,
            tags: draft.tags,
            thumbnailPath: draft.thumbnailUrl,
            isDirty: false,
            errors: const {},
          ));
        }, (full) async {
          final editing = (state is RecipeCreateEditing)
              ? state as RecipeCreateEditing
              : const RecipeCreateEditing();
          emit(editing.copyWith(
            draftId: full.id,
            title: full.title,
            description: full.description,
            ingredients: full.ingredients ?? editing.ingredients,
            steps: full.steps,
            cookingTime: full.cookingTime ?? editing.cookingTime,
            servings: full.servings ?? editing.servings,
            difficulty: full.difficulty ?? editing.difficulty,
            tags: full.tags,
            thumbnailPath: full.thumbnailUrl,
            isDirty: false,
            errors: const {},
          ));
        });
      });
    } catch (_) {
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

      // 임시 저장 API 호출 (있으면 업데이트, 없으면 생성)
      final bool hasDraftId =
          currentState.draftId != null && currentState.draftId!.isNotEmpty;
      if (hasDraftId) {
        final updateResult =
            await _updateRecipeDraft(currentState.draftId!, recipe, userId);
        await updateResult.fold((failure) async {
          if (kDebugMode) {
            print('❌ Draft update failed: ${failure.toString()}');
          }
          emit(RecipeCreateError(
            message: '임시 저장에 실패했습니다',
            previousState: currentState,
          ));
        }, (updatedId) async {
          if (kDebugMode) {
            print('✅ Draft updated: $updatedId');
          }
          final detail = await _getRecipeDetail(updatedId, userId);
          detail.fold((f) {
            emit(RecipeCreateError(
              message: '임시 저장은 완료됐지만 상세 조회에 실패했습니다',
              previousState: currentState,
            ));
          }, (full) {
            // 화면 유지용 상태로 전환 (스낵바만 표시)
            emit(RecipeDraftSaved(
              draftId: full.id,
              title: full.title,
              description: full.description,
              ingredients: full.ingredients ?? currentState.ingredients,
              steps: full.steps,
              cookingTime: full.cookingTime ?? currentState.cookingTime,
              servings: full.servings ?? currentState.servings,
              difficulty: full.difficulty ?? currentState.difficulty,
              tags: full.tags,
              thumbnailPath: full.thumbnailUrl,
              isDirty: false,
              errors: const {},
            ));
          });
        });
      } else {
        final createResult = await _createRecipeDraft(recipe, userId);
        await createResult.fold((failure) async {
          if (kDebugMode) {
            print('❌ Draft create failed: ${failure.toString()}');
          }
          emit(RecipeCreateError(
            message: '임시 저장에 실패했습니다',
            previousState: currentState,
          ));
        }, (savedRecipe) async {
          if (kDebugMode) {
            print('✅ Draft created: ${savedRecipe.id}');
          }
          final detail = await _getRecipeDetail(savedRecipe.id, userId);
          detail.fold((f) {
            // 상세 실패 시 최소한 생성된 정보로 성공 처리할 수도 있으나, 일관성을 위해 에러 처리
            emit(RecipeCreateError(
              message: '임시 저장은 완료됐지만 상세 조회에 실패했습니다',
              previousState: currentState,
            ));
          }, (full) {
            // 화면 유지용 상태로 전환 (스낵바만 표시)
            emit(RecipeDraftSaved(
              draftId: full.id,
              title: full.title,
              description: full.description,
              ingredients: full.ingredients ?? currentState.ingredients,
              steps: full.steps,
              cookingTime: full.cookingTime ?? currentState.cookingTime,
              servings: full.servings ?? currentState.servings,
              difficulty: full.difficulty ?? currentState.difficulty,
              tags: full.tags,
              thumbnailPath: full.thumbnailUrl,
              isDirty: false,
              errors: const {},
            ));
          });
        });
      }
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

  // no-op

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

      // 먼저 임시 저장 (임시 저장은 화면 유지 상태를 내보내므로 결과 id를 확보하도록 다시 조회)
      await saveDraft();

      // saveDraft 이후 상태가 RecipeDraftSaved 여야 함. 아니라면 중단
      final draftSaved = state;
      if (draftSaved is! RecipeDraftSaved || draftSaved.draftId == null) return;

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
      final publishResult = await _publishRecipe(draftSaved.draftId!, userId);

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
