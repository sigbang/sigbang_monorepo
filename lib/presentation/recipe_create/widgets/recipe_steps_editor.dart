import 'package:flutter/material.dart';
import '../../../domain/entities/recipe.dart';
import 'photo_upload_widget.dart';

class RecipeStepsEditor extends StatelessWidget {
  final List<RecipeStep> steps;
  final Map<String, String?> errors;
  final VoidCallback onAddStep;
  final Function(int) onRemoveStep;
  final Function(int, String) onUpdateStepDescription;
  final Function(int, String) onSetStepImage;
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
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 헤더
        Row(
          children: [
            Icon(
              Icons.list_alt,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(width: 8),
            Text(
              '조리 과정',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(width: 4),
            Text(
              '*',
              style: TextStyle(
                color: Theme.of(context).colorScheme.error,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Spacer(),

            // 단계 추가 버튼
            ElevatedButton.icon(
              onPressed: onAddStep,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('단계 추가'),
              style: ElevatedButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // 에러 메시지
        if (errors['steps'] != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.errorContainer,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.error,
                  color: Theme.of(context).colorScheme.onErrorContainer,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    errors['steps']!,
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

        // 단계 목록
        if (steps.isEmpty)
          _buildEmptyState(context)
        else
          ReorderableListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            onReorder: onReorderSteps,
            itemCount: steps.length,
            itemBuilder: (context, index) {
              final step = steps[index];
              return _buildStepCard(context, step, index);
            },
          ),
      ],
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
        ),
      ),
      child: Column(
        children: [
          Icon(
            Icons.playlist_add,
            size: 48,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 16),
          Text(
            '조리 과정을 추가해주세요',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            '위의 "단계 추가" 버튼을 눌러 첫 번째 조리 과정을 추가하세요',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildStepCard(BuildContext context, RecipeStep step, int index) {
    final stepError = errors['step_$index'];

    return Card(
      key: ValueKey(step.order),
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 헤더
            Row(
              children: [
                // 단계 번호
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      '${step.order}',
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                Expanded(
                  child: Text(
                    '${step.order}단계',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),

                // 드래그 핸들
                ReorderableDragStartListener(
                  index: index,
                  child: Icon(
                    Icons.drag_handle,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),

                const SizedBox(width: 8),

                // 삭제 버튼
                IconButton(
                  onPressed: () => onRemoveStep(index),
                  icon: Icon(
                    Icons.delete,
                    color: Theme.of(context).colorScheme.error,
                  ),
                  tooltip: '단계 삭제',
                ),
              ],
            ),
            const SizedBox(height: 16),

            // 단계 설명
            TextField(
              controller: TextEditingController(text: step.description)
                ..selection = TextSelection.fromPosition(
                  TextPosition(offset: step.description.length),
                ),
              onChanged: (value) => onUpdateStepDescription(index, value),
              maxLines: 3,
              maxLength: 200,
              decoration: InputDecoration(
                labelText: '조리 과정 설명',
                hintText: '이 단계에서 해야 할 일을 자세히 설명해주세요',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                errorText: stepError,
                errorBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(
                    color: Theme.of(context).colorScheme.error,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 단계 이미지
            PhotoUploadWidget(
              imagePath: step.imageUrl,
              onTap: () => _showImagePicker(context, index),
              onRemove: step.imageUrl != null
                  ? () => onSetStepImage(index, '')
                  : null,
              label: '단계 이미지 (선택사항)',
            ),
          ],
        ),
      ),
    );
  }

  void _showImagePicker(BuildContext context, int stepIndex) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '이미지 선택',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('카메라로 촬영'),
              onTap: () {
                Navigator.pop(context);
                // TODO: 카메라 촬영 구현
                onSetStepImage(stepIndex, '/mock/camera/step_$stepIndex.jpg');
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('갤러리에서 선택'),
              onTap: () {
                Navigator.pop(context);
                // TODO: 갤러리 선택 구현
                onSetStepImage(stepIndex, '/mock/gallery/step_$stepIndex.jpg');
              },
            ),
          ],
        ),
      ),
    );
  }
}
