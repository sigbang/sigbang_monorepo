import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';
import '../../../domain/entities/recipe.dart';
import '../../../domain/usecases/create_recipe.dart';
import '../../../domain/usecases/update_recipe.dart';

// import '../../../domain/usecases/upload_recipe_images.dart';
import '../../../domain/usecases/upload_image_with_presign.dart';
import 'recipe_create_state.dart';
import '../../../injection/injection.dart';
import '../../../data/datasources/api_client.dart';

class RecipeCreateCubit extends Cubit<RecipeCreateState> {
  final CreateRecipe _createRecipe;
  final UpdateRecipe _updateRecipe;
  final UploadImageWithPresign _uploadImageWithPresign;
  // Optionally used for uploading images later
  // final UploadRecipeThumbnail _uploadRecipeThumbnail;

  RecipeCreateCubit(
    this._createRecipe,
    this._updateRecipe,
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

  /// 기존 레시피로 편집 시작 (prefill)
  void startEditingFromRecipe(Recipe recipe) {
    emit(RecipeCreateEditing(
      editingRecipeId: recipe.id,
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients ?? '',
      steps: recipe.steps,
      cookingTime: recipe.cookingTime ?? 30,
      servings: recipe.servings ?? 2,
      difficulty: recipe.difficulty ?? RecipeDifficulty.medium,
      tags: recipe.tags,
      thumbnailPath: recipe.thumbnailUrl,
      linkName: recipe.linkTitle ?? '',
      linkUrl: recipe.linkUrl ?? '',
      isDirty: false,
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
      if (currentState.steps.length >= 10) {
        // Hard guard: ignore if already at limit
        return;
      }
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

  /// 단계 이미지 삭제
  void clearStepImage(int index) {
    final currentState = state;
    if (currentState is RecipeCreateEditing &&
        index < currentState.steps.length) {
      final steps = List<RecipeStep>.from(currentState.steps);
      steps[index] = steps[index].copyWith(clearImageUrl: true);

      emit(currentState.copyWith(
        steps: steps,
        isDirty: true,
      ));

      if (kDebugMode) {
        print('🧹 Cleared image for step ${index + 1}');
      }
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

  /// 실제 AI 생성 호출: presign 업로드 후 imagePath로 생성 API 호출
  Future<void> generateWithAi() async {
    final currentState = state;
    if (currentState is! RecipeCreateEditing) return;
    if (currentState.thumbnailPath == null ||
        currentState.thumbnailPath!.isEmpty) {
      emit(RecipeCreateError(
        message: '대표 이미지를 먼저 선택해주세요',
        previousState: currentState,
      ));
      return;
    }

    try {
      // 로딩 표시
      emit(RecipeCreateUploading(
        title: currentState.title,
        description: currentState.description,
        ingredients: currentState.ingredients,
        steps: currentState.steps.isEmpty
            ? [const RecipeStep(order: 1, description: '', imageUrl: null)]
            : currentState.steps,
        cookingTime: currentState.cookingTime,
        servings: currentState.servings,
        difficulty: currentState.difficulty,
        tags: currentState.tags,
        linkName: currentState.linkName,
        linkUrl: currentState.linkUrl,
        thumbnailPath: currentState.thumbnailPath,
        currentStep: 'AI로 레시피 생성 중...',
        progress: 0.2,
      ));

      // presign 업로드 필요 시 수행
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

      // AI 생성 요청
      final apiClient = getIt<ApiClient>();
      final response = await apiClient.dio.post(
        '/recipes/ai/generate',
        data: {
          'imagePath': uploadedThumbnailPath,
          if (currentState.title.trim().isNotEmpty)
            'title': currentState.title.trim(),
        },
      );

      if (response.statusCode == 201) {
        final data = response.data is Map<String, dynamic>
            ? response.data
            : (response.data['data'] ?? response.data);
        final title = (data['title'] as String?)?.trim() ?? '';
        final description = (data['description'] as String?)?.trim() ?? '';
        final ingredients = (data['ingredients'] as String?)?.trim() ?? '';
        final cookingTime =
            (data['cookingTime'] as num?)?.toInt() ?? currentState.cookingTime;
        final stepsJson = (data['steps'] as List<dynamic>? ?? []);
        final steps = stepsJson
            .map((s) => RecipeStep(
                  order: (s['order'] as num?)?.toInt() ?? 1,
                  description: (s['description'] as String?)?.trim() ?? '',
                ))
            .toList();

        emit(RecipeCreateEditing(
          draftId: currentState.draftId,
          editingRecipeId: currentState.editingRecipeId,
          title: currentState.title.trim().isEmpty ? title : currentState.title,
          description: description,
          ingredients: ingredients,
          steps: steps.isNotEmpty
              ? steps
              : [const RecipeStep(order: 1, description: '', imageUrl: null)],
          cookingTime: cookingTime,
          servings: currentState.servings,
          difficulty: currentState.difficulty,
          tags: currentState.tags,
          // Keep local gallery image for preview; server path is used only for API
          thumbnailPath: currentState.thumbnailPath,
          linkName: currentState.linkName,
          linkUrl: currentState.linkUrl,
          isDirty: true,
          errors: const {},
        ));
        return;
      }

      emit(RecipeCreateError(
        message: 'AI 레시피 생성에 실패했습니다',
        previousState: currentState,
      ));
    } catch (e) {
      emit(RecipeCreateError(
        message: 'AI 레시피 생성 중 오류가 발생했습니다',
        previousState: currentState,
      ));
    }
  }

  /// 발행 (즉시 생성/공개)
  /// 필수: 썸네일, 제목. 단계는 최소 1개 존재해야 하지만 내용은 비어도 허용.
  Future<void> publishRecipe() async {
    final currentState = state;
    if (currentState is! RecipeCreateEditing) return;

    try {
      // 검증: 썸네일 + 제목 필수. 단계는 최소 1개 (내용은 비어도 허용)
      final validationErrors = <String, String?>{};
      if (currentState.thumbnailPath == null) {
        validationErrors['thumbnail'] = '대표 이미지를 선택해주세요';
      }
      if (currentState.title.trim().isEmpty) {
        validationErrors['title'] = '제목을 입력해주세요';
      }
      final ensuredSteps = currentState.steps.isEmpty
          ? [const RecipeStep(order: 1, description: '', imageUrl: null)]
          : currentState.steps;
      if (validationErrors.isNotEmpty) {
        emit(currentState.copyWith(
          errors: validationErrors,
          // 값은 그대로 유지 (자동 채우기 제거)
          steps: ensuredSteps,
        ));
        return;
      }

      emit(RecipeCreateUploading(
        title: currentState.title.trim(),
        description: currentState.description.trim(),
        ingredients: currentState.ingredients.trim(),
        steps: ensuredSteps,
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
      for (final s in ensuredSteps) {
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
        title: currentState.title.trim(),
        description: currentState.description.trim(),
        ingredients: currentState.ingredients.trim(),
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
        id: currentState.editingRecipeId ?? '',
        title: currentState.title.trim(),
        description: currentState.description.trim(),
        ingredients: currentState.ingredients.trim(),
        steps: uploadedSteps,
        cookingTime: currentState.cookingTime,
        servings: currentState.servings,
        difficulty: currentState.difficulty,
        status: RecipeStatus.published,
        tags: currentState.tags,
        thumbnailUrl: uploadedThumbnailPath,
        linkTitle: currentState.linkName.isEmpty ? null : currentState.linkName,
        linkUrl: currentState.linkUrl.isEmpty ? null : currentState.linkUrl,
        viewCount: 0,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        isSaved: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        author: null,
      );

      final isEditing = currentState.editingRecipeId != null;
      final result = isEditing
          ? await _updateRecipe(recipe)
              .then((either) => either.map((_) => recipe.id))
          : await _createRecipe(recipe);
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
          if (isEditing) {
            print('✅ Recipe updated: $createdId');
          } else {
            print('✅ Recipe created: $createdId');
          }
        }
        if (isEditing) {
          emit(RecipeUpdateSuccess(recipeId: createdId));
        } else {
          emit(RecipeCreateSuccess(recipeId: createdId));
        }
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
