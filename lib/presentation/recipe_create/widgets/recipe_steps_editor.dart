import 'package:flutter/material.dart';
import 'dart:typed_data';
import 'dart:io';
import '../../../domain/entities/recipe.dart';
import '../../common/widgets/app_confirm_dialog.dart';
import '../../../core/image/image_processing_service.dart';
import '../../../core/image/gallery_picker_service.dart';

class RecipeStepsEditor extends StatefulWidget {
  final List<RecipeStep> steps;
  final Map<String, String?> errors;
  final VoidCallback onAddStep;
  final Function(int) onRemoveStep;
  final Function(int, String) onUpdateStepDescription;
  final Function(int, String) onSetStepImage;
  final Function(int) onClearStepImage;
  final Function(int, int) onReorderSteps;

  const RecipeStepsEditor({
    super.key,
    required this.steps,
    required this.errors,
    required this.onAddStep,
    required this.onRemoveStep,
    required this.onUpdateStepDescription,
    required this.onSetStepImage,
    required this.onReorderSteps,
    required this.onClearStepImage,
  });

  @override
  State<RecipeStepsEditor> createState() => _RecipeStepsEditorState();
}

class _RecipeStepsEditorState extends State<RecipeStepsEditor> {
  // Controllers and focus nodes are kept stable across rebuilds to avoid
  // breaking IME composition and cursor position while typing.
  final List<TextEditingController> _controllers = [];
  final List<FocusNode> _focusNodes = [];

  @override
  void initState() {
    super.initState();
    _initializeControllers(initial: true);
  }

  @override
  void didUpdateWidget(RecipeStepsEditor oldWidget) {
    super.didUpdateWidget(oldWidget);
    _initializeControllers(initial: false);
  }

  void _initializeControllers({required bool initial}) {
    final int desiredCount = widget.steps.length;

    // Add missing controllers/focus nodes
    while (_controllers.length < desiredCount) {
      final index = _controllers.length;
      _controllers.add(TextEditingController(
        text: widget.steps[index].description,
      ));
      _focusNodes.add(FocusNode());
    }

    // Remove extra controllers/focus nodes
    while (_controllers.length > desiredCount) {
      final removedController = _controllers.removeLast();
      removedController.dispose();
      final removedFocus = _focusNodes.removeLast();
      removedFocus.dispose();
    }

    // Sync text for existing items only when not focused and only if changed meaningfully
    if (!initial) {
      final int minLen = _controllers.length < widget.steps.length
          ? _controllers.length
          : widget.steps.length;
      for (int i = 0; i < minLen; i++) {
        final controller = _controllers[i];
        final focusNode = _focusNodes[i];
        final desiredText = widget.steps[i].description;

        if (!focusNode.hasFocus && controller.text != desiredText) {
          controller.text = desiredText;
          controller.selection = TextSelection.fromPosition(
            TextPosition(offset: controller.text.length),
          );
        }
      }
    }
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var focus in _focusNodes) {
      focus.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 섹션 타이틀
        Text(
          '요리 순서',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: 16),

        // 에러 메시지
        if (widget.errors['steps'] != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.errorContainer,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.error_outline,
                  color: Theme.of(context).colorScheme.onErrorContainer,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    widget.errors['steps']!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onErrorContainer,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        ReorderableListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: widget.steps.length,
          onReorder: widget.onReorderSteps,
          buildDefaultDragHandles: false,
          itemBuilder: (context, index) {
            final step = widget.steps[index];
            return Padding(
              key: ValueKey(widget.steps[index].order),
              padding: const EdgeInsets.only(bottom: 20),
              child: _buildStepRow(context, step, index),
            );
          },
        ),

        const SizedBox(height: 16),

        // 하단 추가 버튼 (검은색, 둥근)
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () {
              if (widget.steps.length >= 10) {
                showAppConfirmDialog(
                  context,
                  title: '단계 제한',
                  message: '요리 순서는 최대 10개까지 추가할 수 있어요.',
                  confirmText: '확인',
                  showCancel: false,
                );
                return;
              }
              widget.onAddStep();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
              shape: const StadiumBorder(),
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            icon: const Icon(Icons.add),
            label: const Text('요리순서 추가'),
          ),
        ),
      ],
    );
  }

  // (empty-state removed): 첫 진입 시 Cubit이 1개 단계를 생성합니다.

  Widget _buildStepRow(BuildContext context, RecipeStep step, int index) {
    final stepError = widget.errors['step_$index'];

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 좌측 번호/삭제 아이콘
        SizedBox(
          width: 36,
          child: Column(
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    '${step.order}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              // 드래그 핸들 (숫자 아래)
              ReorderableDragStartListener(
                index: index,
                child: Icon(
                  Icons.drag_indicator,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 8),
              IconButton(
                onPressed: () => _confirmRemoveStep(context, index),
                icon: Icon(
                  Icons.delete,
                  color: Theme.of(context).colorScheme.error,
                ),
                tooltip: '단계 삭제',
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        // 카드
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 설명 입력
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: stepError == null
                          ? const Color(0xFFDADADA)
                          : Theme.of(context).colorScheme.error,
                      width: 1,
                    ),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(11),
                    child: TextField(
                      key: ValueKey('tf_${step.order}'),
                      controller: _controllers[index],
                      focusNode: _focusNodes[index],
                      onChanged: (value) =>
                          widget.onUpdateStepDescription(index, value),
                      maxLines: 3,
                      maxLength: 200,
                      decoration: const InputDecoration(
                        filled: true,
                        fillColor: Colors.white,
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        errorBorder: InputBorder.none,
                        focusedErrorBorder: InputBorder.none,
                        hintText:
                            '예) 손질된 야채와 고기를 후라이팬에 넣습니다.\n기름을 두르고 중불로 10분동안 볶아요.',
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 12,
                        ),
                        counterText: '',
                      ),
                    ),
                  ),
                ),
                if (stepError != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    stepError,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                      fontSize: 12,
                    ),
                  ),
                ],
                const SizedBox(height: 12),

                // 이미지 영역: 선택 시 미리보기, 아니면 카메라 버튼
                if (step.imageUrl != null && step.imageUrl!.isNotEmpty)
                  Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: GestureDetector(
                          onTap: () => _pickImageFromGallery(index),
                          child: Image(
                            image: step.imageUrl!.startsWith('http')
                                ? NetworkImage(step.imageUrl!) as ImageProvider
                                : FileImage(
                                    File(step.imageUrl!),
                                  ) as ImageProvider,
                            height: 160,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      Positioned(
                        right: 8,
                        top: 8,
                        child: Row(
                          children: [
                            _ActionChip(
                              icon: Icons.edit,
                              tooltip: '이미지 변경',
                              onPressed: () => _pickImageFromGallery(index),
                            ),
                            const SizedBox(width: 8),
                            _ActionChip(
                              icon: Icons.delete_outline,
                              tooltip: '이미지 삭제',
                              color: Theme.of(context).colorScheme.error,
                              onPressed: () =>
                                  _confirmRemoveStepImage(context, index),
                            ),
                          ],
                        ),
                      ),
                    ],
                  )
                else
                  GestureDetector(
                    onTap: () => _pickImageFromGallery(index),
                    child: Container(
                      height: 48,
                      decoration: BoxDecoration(
                        color: Theme.of(context)
                            .colorScheme
                            .surfaceContainerHighest
                            .withOpacity(0.6),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Icon(
                          Icons.camera_alt,
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _pickImageFromGallery(int stepIndex) async {
    final Uint8List? bytes = await GalleryPickerService.pickSingleImageBytes(
      context,
      preferCameraRoll: true,
    );
    if (bytes == null) return;

    final processed = await ImageProcessingService.processCroppedBytes(
      croppedBytes: bytes,
      format: OutputFormat.webp,
    );
    if (processed.tempFile != null) {
      widget.onSetStepImage(stepIndex, processed.tempFile!.path);
    }
  }

  void _confirmRemoveStep(BuildContext context, int index) async {
    final confirmed = await showAppConfirmDialog(
      context,
      title: '이 단계를 삭제할까요?',
      message: '삭제 후에는 되돌릴 수 없습니다.',
      cancelText: '취소',
      confirmText: '삭제',
      confirmColor: Theme.of(context).colorScheme.error,
    );
    if (confirmed == true) {
      widget.onRemoveStep(index);
    }
  }

  Future<void> _confirmRemoveStepImage(BuildContext context, int index) async {
    final confirmed = await showAppConfirmDialog(
      context,
      title: '이미지를 삭제할까요?',
      message: '이 단계의 이미지를 삭제합니다.',
      cancelText: '취소',
      confirmText: '삭제',
      confirmColor: Theme.of(context).colorScheme.error,
    );
    if (confirmed == true) {
      widget.onClearStepImage(index);
    }
  }
}

class _ActionChip extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback onPressed;
  final Color? color;

  const _ActionChip({
    required this.icon,
    required this.tooltip,
    required this.onPressed,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.9),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
            border: Border.all(
              color: const Color(0xFFEAEAEA),
            ),
          ),
          child: Icon(
            icon,
            size: 18,
            color: color ?? Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}
