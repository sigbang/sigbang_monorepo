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
// import '../widgets/tag_selector.dart';
import '../../common/widgets/app_confirm_dialog.dart';

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

class RecipeCreateView extends StatefulWidget {
  const RecipeCreateView({super.key});

  @override
  State<RecipeCreateView> createState() => _RecipeCreateViewState();
}

class _RecipeCreateViewState extends State<RecipeCreateView> {
  int _step = 0; // 0: 기본정보(제목/설명), 1: 재료/시간, 2: 조리과정

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<RecipeCreateCubit, RecipeCreateState>(
      listener: (context, state) {
        if (state is RecipeCreateSuccess) {
          // 발행 성공 시 알림 및 피드로 이동
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('레시피가 성공적으로 발행되었습니다!'),
              backgroundColor: Colors.green,
            ),
          );

          context.go('/');
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
          body: _buildBody(context, state),
          bottomNavigationBar: _buildBottomBar(context, state),
        );
      },
    );
  }

  Widget _buildBody(BuildContext context, RecipeCreateState state) {
    // no draft checking

    if (state is RecipeCreateUploading) {
      return SafeArea(child: _buildUploadingView(context, state));
    }

    if (state is RecipeCreateEditing) {
      return SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 헤더 (AppBar 대체)
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => _showExitDialog(context, state),
                  ),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      '레시피 등록',
                      textAlign: TextAlign.center,
                      style:
                          TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
                    ),
                  ),
                  // 헤더 우측 버튼 제거
                ],
              ),
              const SizedBox(height: 8),
              if (_step == 0) ...[
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
                const SizedBox(height: 8),
                Text(
                  '대표사진을 추가하면 AI로 레시피를 생성할 수 있습니다.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: state.thumbnailPath != null
                        ? () => context
                            .read<RecipeCreateCubit>()
                            .generateWithAiMock()
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.amber,
                      disabledBackgroundColor: Colors.amber.shade50,
                      foregroundColor: Colors.black,
                      disabledForegroundColor: Colors.black45,
                      shape: const StadiumBorder(),
                      padding: const EdgeInsets.symmetric(
                          vertical: 14, horizontal: 24),
                    ),
                    child: const Text('AI로 레시피 생성'),
                  ),
                ),
                const SizedBox(height: 16),
              ],
              const SizedBox(height: 16),

              if (_step == 0) ...[
                // 기본 정보 (제목/설명)
                BasicInfoForm(
                  title: state.title,
                  description: state.description,
                  ingredients: state.ingredients,
                  cookingTime: state.cookingTime,
                  difficulty: state.difficulty,
                  linkName: state.linkName,
                  linkUrl: state.linkUrl,
                  errors: state.errors,
                  onTitleChanged: (value) =>
                      context.read<RecipeCreateCubit>().updateTitle(value),
                  onDescriptionChanged: (value) => context
                      .read<RecipeCreateCubit>()
                      .updateDescription(value),
                  onIngredientsChanged: (value) => context
                      .read<RecipeCreateCubit>()
                      .updateIngredients(value),
                  onCookingTimeChanged: (value) => context
                      .read<RecipeCreateCubit>()
                      .updateCookingTime(value),
                  onDifficultyChanged: (value) =>
                      context.read<RecipeCreateCubit>().updateDifficulty(value),
                  onLinkNameChanged: (v) =>
                      context.read<RecipeCreateCubit>().updateLinkName(v),
                  onLinkUrlChanged: (v) =>
                      context.read<RecipeCreateCubit>().updateLinkUrl(v),
                  showIngredients: false,
                  showCookingTime: false,
                  showDifficulty: false,
                ),
                const SizedBox(height: 16),
                // Step 1에서는 상단 버튼만 사용
              ] else if (_step == 1) ...[
                // 재료 + 요리시간 슬라이더
                BasicInfoForm(
                  title: state.title,
                  description: state.description,
                  ingredients: state.ingredients,
                  cookingTime: state.cookingTime,
                  difficulty: state.difficulty,
                  linkName: state.linkName,
                  linkUrl: state.linkUrl,
                  errors: state.errors,
                  onTitleChanged: (value) =>
                      context.read<RecipeCreateCubit>().updateTitle(value),
                  onDescriptionChanged: (value) => context
                      .read<RecipeCreateCubit>()
                      .updateDescription(value),
                  onIngredientsChanged: (value) => context
                      .read<RecipeCreateCubit>()
                      .updateIngredients(value),
                  onCookingTimeChanged: (value) => context
                      .read<RecipeCreateCubit>()
                      .updateCookingTime(value),
                  onDifficultyChanged: (value) =>
                      context.read<RecipeCreateCubit>().updateDifficulty(value),
                  onLinkNameChanged: (v) =>
                      context.read<RecipeCreateCubit>().updateLinkName(v),
                  onLinkUrlChanged: (v) =>
                      context.read<RecipeCreateCubit>().updateLinkUrl(v),
                  showTitle: false,
                  showDescription: false,
                  showIngredients: true,
                  showCookingTime: true,
                  showDifficulty: false,
                  showLinkFields: true,
                ),
              ] else ...[
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
              ],
              const SizedBox(height: 100), // 하단 바 공간
            ],
          ),
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

    return SafeArea(
      top: false,
      child: Container(
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
            if (_step > 0)
              Expanded(
                child: ElevatedButton(
                  onPressed: () => setState(() => _step -= 1),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.grey.shade300,
                    foregroundColor: Colors.black,
                    shape: const StadiumBorder(),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('이전'),
                ),
              ),
            if (_step > 0) const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: () {
                  if (_step < 2) {
                    setState(() => _step += 1);
                  } else {
                    context.read<RecipeCreateCubit>().publishRecipe();
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                      _step < 2 ? null : Colors.amber, // null -> theme default
                  foregroundColor: _step < 2 ? null : Colors.black,
                  shape: const StadiumBorder(),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: Text(_step < 2 ? '다음' : '레시피 업로드'),
              ),
            ),
          ],
        ),
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

  void _showExitDialog(BuildContext context, RecipeCreateState state) async {
    final isDirty = state is RecipeCreateEditing && state.isDirty;

    if (!isDirty) {
      context.pop();
      return;
    }

    final confirmed = await showAppConfirmDialog(
      context,
      title: '작성 중인 내용이 있습니다',
      message: '나가시면 작성한 내용이 모두 삭제됩니다. 정말 나가시겠습니까?',
      cancelText: '계속 작성',
      confirmText: '나가기',
      confirmColor: Theme.of(context).colorScheme.error,
    );
    if (confirmed == true) {
      context.pop();
    }
  }
}
