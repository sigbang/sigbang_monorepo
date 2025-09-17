import 'package:flutter/material.dart';
import 'dart:async';
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
import '../../../core/utils/action_guard.dart';
import '../../session/session_cubit.dart';

class RecipeCreatePage extends StatelessWidget {
  const RecipeCreatePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SessionCubit, SessionState>(
      builder: (context, sessionState) {
        final canCreate = ActionGuard.canPerform(
            sessionState.user?.status, ActionType.createRecipe);

        if (!canCreate && sessionState.user != null) {
          return Scaffold(
            appBar: AppBar(title: const Text('레시피 생성')),
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.block,
                    size: 64,
                    color: Theme.of(context).colorScheme.error,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    ActionGuard.getRestrictionMessage(ActionType.createRecipe),
                    style: Theme.of(context).textTheme.titleMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('돌아가기'),
                  ),
                ],
              ),
            ),
          );
        }

        return BlocProvider(
          create: (context) => getIt<RecipeCreateCubit>()..startEditing(),
          child: const RecipeCreateView(),
        );
      },
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
  int _lastPulseKey = 0;
  bool _pulseActive = false;
  Timer? _pulseTimer;

  @override
  void dispose() {
    _pulseTimer?.cancel();
    super.dispose();
  }

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
        } else if (state is RecipeUpdateSuccess) {
          // 수정 성공
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('레시피가 성공적으로 수정되었습니다!'),
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
        } else if (state is RecipeCreateEditing) {
          // Trigger a short pulse when AI fills the form
          if (state.aiPulseKey != _lastPulseKey && state.aiPulseKey > 0) {
            _pulseTimer?.cancel();
            setState(() {
              _pulseActive = true;
              _lastPulseKey = state.aiPulseKey;
            });
            _pulseTimer = Timer(const Duration(milliseconds: 700), () {
              if (mounted) {
                setState(() {
                  _pulseActive = false;
                });
              }
            });
          }
        }
      },
      builder: (context, state) {
        return Scaffold(
          body: Stack(
            children: [
              _buildBody(context, state),
              if (state is RecipeCreateUploading)
                _FullScreenLoader(
                  message: state.currentStep.isNotEmpty
                      ? state.currentStep
                      : 'AI로 레시피 생성 중...',
                  onCancel: state.canCancel
                      ? () =>
                          context.read<RecipeCreateCubit>().cancelAiGeneration()
                      : null,
                ),
            ],
          ),
          bottomNavigationBar: _buildBottomBar(context, state),
        );
      },
    );
  }

  Widget _buildBody(BuildContext context, RecipeCreateState state) {
    // no draft checking

    // 업로드 중에도 기존 편집 화면을 유지하고, 상단 Stack 오버레이로 진행상태만 표시

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
                  Expanded(
                    child: Text(
                      state.editingRecipeId != null ? '레시피 수정' : '레시피 등록',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          fontSize: 20, fontWeight: FontWeight.w600),
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
                        ? () =>
                            context.read<RecipeCreateCubit>().generateWithAi()
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
                // Keep a key to allow local pulse triggers but remove outer glow
                KeyedSubtree(
                  key: ValueKey(state.aiPulseKey),
                  child: BasicInfoForm(
                    title: state.title,
                    description: state.description,
                    ingredients: state.ingredients,
                    cookingTime: state.cookingTime,
                    difficulty: state.difficulty,
                    linkName: state.linkName,
                    linkUrl: state.linkUrl,
                    errors: state.errors,
                    pulseInputs: _pulseActive,
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
                    onDifficultyChanged: (value) => context
                        .read<RecipeCreateCubit>()
                        .updateDifficulty(value),
                    onLinkNameChanged: (v) =>
                        context.read<RecipeCreateCubit>().updateLinkName(v),
                    onLinkUrlChanged: (v) =>
                        context.read<RecipeCreateCubit>().updateLinkUrl(v),
                    showIngredients: false,
                    showCookingTime: false,
                    showDifficulty: false,
                  ),
                ),
                const SizedBox(height: 16),
                // Step 1에서는 상단 버튼만 사용
              ] else if (_step == 1) ...[
                // 재료 + 요리시간 슬라이더
                KeyedSubtree(
                  key: ValueKey(state.aiPulseKey),
                  child: BasicInfoForm(
                    title: state.title,
                    description: state.description,
                    ingredients: state.ingredients,
                    cookingTime: state.cookingTime,
                    difficulty: state.difficulty,
                    linkName: state.linkName,
                    linkUrl: state.linkUrl,
                    errors: state.errors,
                    pulseInputs: _pulseActive,
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
                    onDifficultyChanged: (value) => context
                        .read<RecipeCreateCubit>()
                        .updateDifficulty(value),
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
                  onClearStepImage: (index) =>
                      context.read<RecipeCreateCubit>().clearStepImage(index),
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

  // 업로드 전용 본문은 제거 (오버레이만 사용)

  Widget? _buildBottomBar(BuildContext context, RecipeCreateState state) {
    if (state is RecipeCreateUploading) {
      // Hide bar entirely during AI generation/upload to prevent navigation
      return null;
    }
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
                child: Text(_step < 2
                    ? '다음'
                    : (state.editingRecipeId != null ? '레시피 수정' : '레시피 업로드')),
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

class _FullScreenLoader extends StatelessWidget {
  final String message;
  final VoidCallback? onCancel;
  const _FullScreenLoader({required this.message, this.onCancel});

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: AbsorbPointer(
        absorbing: true,
        child: Container(
          color: Colors.black.withOpacity(0.35),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(
                  width: 72,
                  height: 72,
                  child: CircularProgressIndicator(),
                ),
                const SizedBox(height: 12),
                Text(
                  message,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onInverseSurface,
                    fontSize: 16,
                  ),
                ),
                if (onCancel != null) ...[
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: onCancel,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                      shape: const StadiumBorder(),
                      padding: const EdgeInsets.symmetric(
                          vertical: 10, horizontal: 18),
                    ),
                    child: const Text('취소'),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
