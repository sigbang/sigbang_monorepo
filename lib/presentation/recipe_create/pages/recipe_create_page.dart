import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'dart:typed_data';
import '../../../core/image/image_processing_service.dart';
import '../../../core/image/gallery_picker_service.dart';
import '../../../injection/injection.dart';
import '../cubits/recipe_create_cubit.dart';
import '../cubits/recipe_create_state.dart';
import '../widgets/photo_upload_widget.dart';
import '../widgets/basic_info_form.dart';
import '../widgets/recipe_steps_editor.dart';
import '../widgets/tag_selector.dart';

class RecipeCreatePage extends StatelessWidget {
  const RecipeCreatePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => getIt<RecipeCreateCubit>()..startEditing(),
      child: const RecipeCreateView(),
    );
  }
}

class RecipeCreateView extends StatelessWidget {
  const RecipeCreateView({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<RecipeCreateCubit, RecipeCreateState>(
      listener: (context, state) {
        if (state is RecipeCreateSuccess) {
          // 발행 성공 시 알림 및 화면 이동
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('레시피가 성공적으로 발행되었습니다!'),
              backgroundColor: Colors.green,
            ),
          );

          context.pushReplacement('/recipe/${state.recipe.id}');
        } else if (state is RecipeDraftSaved) {
          // 임시 저장 성공: 화면 유지, 스낵바만
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('레시피가 임시 저장되었습니다'),
              backgroundColor: Colors.green,
            ),
          );
        } else if (state is RecipeCreateError) {
          // 에러 시 알림
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: Theme.of(context).colorScheme.error,
              action: SnackBarAction(
                label: '다시 시도',
                onPressed: () {
                  context.read<RecipeCreateCubit>().recoverFromError();
                },
              ),
            ),
          );
        }
      },
      builder: (context, state) {
        return Scaffold(
          appBar: _buildAppBar(context, state),
          body: _buildBody(context, state),
          bottomNavigationBar: _buildBottomBar(context, state),
        );
      },
    );
  }

  PreferredSizeWidget _buildAppBar(
      BuildContext context, RecipeCreateState state) {
    return AppBar(
      title: const Text('레시피 등록'),
      leading: IconButton(
        icon: const Icon(Icons.close),
        onPressed: () => _showExitDialog(context, state),
      ),
      actions: [
        if (state is RecipeCreateEditing && state.isDirty)
          TextButton(
            onPressed: () => context.read<RecipeCreateCubit>().saveDraft(),
            child: const Text('임시저장'),
          ),
      ],
    );
  }

  Widget _buildBody(BuildContext context, RecipeCreateState state) {
    if (state is RecipeCreateChecking) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              SizedBox(
                width: 72,
                height: 72,
                child: CircularProgressIndicator(strokeWidth: 6),
              ),
              SizedBox(height: 16),
              Text('임시 저장 확인 중...'),
            ],
          ),
        ),
      );
    }

    if (state is RecipeCreateUploading) {
      return _buildUploadingView(context, state);
    }

    if (state is RecipeCreateEditing) {
      return SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 대표 이미지
            PhotoUploadWidget(
              imagePath: state.thumbnailPath,
              onTap: () => _showImagePicker(context, isThumbnail: true),
              onRemove: state.thumbnailPath != null
                  ? () => context.read<RecipeCreateCubit>().setThumbnail('')
                  : null,
              label: '대표 이미지',
              isRequired: true,
              error: state.errors['thumbnail'],
            ),
            const SizedBox(height: 32),

            // 기본 정보
            BasicInfoForm(
              title: state.title,
              description: state.description,
              ingredients: state.ingredients,
              cookingTime: state.cookingTime,
              servings: state.servings,
              difficulty: state.difficulty,
              errors: state.errors,
              onTitleChanged: (value) =>
                  context.read<RecipeCreateCubit>().updateTitle(value),
              onDescriptionChanged: (value) =>
                  context.read<RecipeCreateCubit>().updateDescription(value),
              onIngredientsChanged: (value) =>
                  context.read<RecipeCreateCubit>().updateIngredients(value),
              onCookingTimeChanged: (value) =>
                  context.read<RecipeCreateCubit>().updateCookingTime(value),
              onServingsChanged: (value) =>
                  context.read<RecipeCreateCubit>().updateServings(value),
              onDifficultyChanged: (value) =>
                  context.read<RecipeCreateCubit>().updateDifficulty(value),
            ),
            const SizedBox(height: 32),

            // 조리 과정
            RecipeStepsEditor(
              steps: state.steps,
              errors: state.errors,
              onAddStep: () => context.read<RecipeCreateCubit>().addStep(),
              onRemoveStep: (index) =>
                  context.read<RecipeCreateCubit>().removeStep(index),
              onUpdateStepDescription: (index, description) => context
                  .read<RecipeCreateCubit>()
                  .updateStepDescription(index, description),
              onSetStepImage: (index, imagePath) => context
                  .read<RecipeCreateCubit>()
                  .setStepImage(index, imagePath),
              onReorderSteps: (oldIndex, newIndex) => context
                  .read<RecipeCreateCubit>()
                  .reorderSteps(oldIndex, newIndex),
            ),
            const SizedBox(height: 32),

            // 태그 선택
            TagSelector(
              selectedTags: state.tags,
              onTagToggle: (tag) =>
                  context.read<RecipeCreateCubit>().toggleTag(tag),
            ),
            const SizedBox(height: 100), // 하단 바 공간
          ],
        ),
      );
    }

    // 초기 상태 또는 에러 상태
    return const Center(
      child: CircularProgressIndicator(),
    );
  }

  Widget _buildUploadingView(
      BuildContext context, RecipeCreateUploading state) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 100,
            height: 100,
            child: CircularProgressIndicator(
              value: state.progress,
              strokeWidth: 6,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            state.currentStep,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            '${(state.progress * 100).toInt()}%',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
        ],
      ),
    );
  }

  Widget? _buildBottomBar(BuildContext context, RecipeCreateState state) {
    if (state is! RecipeCreateEditing) return null;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          top: BorderSide(
            color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
          ),
        ),
      ),
      child: Row(
        children: [
          // 임시 저장 버튼
          Expanded(
            child: OutlinedButton(
              onPressed: state.title.trim().isNotEmpty
                  ? () => context.read<RecipeCreateCubit>().saveDraft()
                  : null,
              child: const Text('임시 저장'),
            ),
          ),
          const SizedBox(width: 16),

          // 발행 버튼
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: state.isValid
                  ? () => context.read<RecipeCreateCubit>().publishRecipe()
                  : null,
              child: const Text('발행하기'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showImagePicker(BuildContext context,
      {bool isThumbnail = false}) async {
    // Advanced gallery picker: image-only, MIME filtered, prefer camera roll
    final Uint8List? bytes = await GalleryPickerService.pickSingleImageBytes(
      context,
      preferCameraRoll: true,
    );
    if (bytes == null) return;

    // No edit modal: directly center-crop 1:1 and optimize
    final processed = await ImageProcessingService.processCroppedBytes(
      croppedBytes: bytes,
      format: OutputFormat.webp,
    );
    if (processed.tempFile != null && isThumbnail) {
      context.read<RecipeCreateCubit>().setThumbnail(processed.tempFile!.path);
    }
  }

  void _showExitDialog(BuildContext context, RecipeCreateState state) {
    final isDirty = state is RecipeCreateEditing && state.isDirty;

    if (!isDirty) {
      context.pop();
      return;
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('작성 중인 내용이 있습니다'),
        content: const Text('저장하지 않고 나가시면 작성한 내용이 모두 삭제됩니다. 정말 나가시겠습니까?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('계속 작성'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context); // 다이얼로그 닫기
              context.pop(); // 페이지 나가기
            },
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('나가기'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context); // 다이얼로그 닫기
              context.read<RecipeCreateCubit>().saveDraft();
            },
            child: const Text('저장 후 나가기'),
          ),
        ],
      ),
    );
  }
}
