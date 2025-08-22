import 'package:flutter/material.dart';
import '../../../domain/entities/recipe.dart';

class BasicInfoForm extends StatefulWidget {
  final String title;
  final String description;
  final String ingredients;
  final int cookingTime;
  final RecipeDifficulty difficulty;
  final Map<String, String?> errors;
  final Function(String) onTitleChanged;
  final Function(String) onDescriptionChanged;
  final Function(String) onIngredientsChanged;
  final Function(int) onCookingTimeChanged;
  final Function(RecipeDifficulty) onDifficultyChanged;
  // Section visibility flags for flexible layouts
  final bool showTitle;
  final bool showDescription;
  final bool showIngredients;
  final bool showCookingTime;
  final bool showDifficulty;

  const BasicInfoForm({
    super.key,
    required this.title,
    required this.description,
    required this.ingredients,
    required this.cookingTime,
    required this.difficulty,
    required this.errors,
    required this.onTitleChanged,
    required this.onDescriptionChanged,
    required this.onIngredientsChanged,
    required this.onCookingTimeChanged,
    required this.onDifficultyChanged,
    this.showTitle = true,
    this.showDescription = true,
    this.showIngredients = true,
    this.showCookingTime = true,
    this.showDifficulty = true,
  });

  @override
  State<BasicInfoForm> createState() => _BasicInfoFormState();
}

class _BasicInfoFormState extends State<BasicInfoForm> {
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  late TextEditingController _ingredientsController;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.title);
    _descriptionController = TextEditingController(text: widget.description);
    _ingredientsController = TextEditingController(text: widget.ingredients);
  }

  @override
  void didUpdateWidget(BasicInfoForm oldWidget) {
    super.didUpdateWidget(oldWidget);

    // 외부에서 값이 변경된 경우에만 컨트롤러 업데이트
    if (oldWidget.title != widget.title &&
        _titleController.text != widget.title) {
      _titleController.text = widget.title;
    }
    if (oldWidget.description != widget.description &&
        _descriptionController.text != widget.description) {
      _descriptionController.text = widget.description;
    }
    if (oldWidget.ingredients != widget.ingredients &&
        _ingredientsController.text != widget.ingredients) {
      _ingredientsController.text = widget.ingredients;
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _ingredientsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.showTitle) ...[
          _buildTextField(
            context,
            label: '레시피 제목',
            controller: _titleController,
            onChanged: widget.onTitleChanged,
            error: widget.errors['title'],
            isRequired: true,
            maxLength: 50,
            hintText: '제목',
          ),
          const SizedBox(height: 24),
        ],
        if (widget.showDescription) ...[
          _buildTextField(
            context,
            label: '레시피 설명',
            controller: _descriptionController,
            onChanged: widget.onDescriptionChanged,
            error: widget.errors['description'],
            isRequired: true,
            maxLines: 3,
            maxLength: 200,
            hintText: '레시피에 대한 간단한 설명을 입력하세요',
          ),
          const SizedBox(height: 24),
        ],
        if (widget.showIngredients) ...[
          _buildTextField(
            context,
            label: '재료',
            controller: _ingredientsController,
            onChanged: widget.onIngredientsChanged,
            error: widget.errors['ingredients'],
            isRequired: true,
            maxLines: 5,
            maxLength: 500,
            hintText: '예:\n- 돼지고기 200g\n- 양파 1개\n- 간장 2큰술\n- 마늘 3쪽',
          ),
          const SizedBox(height: 24),
        ],
        if (widget.showCookingTime) ...[
          _buildTimeSlider(context),
          const SizedBox(height: 24),
        ],
        if (widget.showDifficulty) _buildDifficultySelector(context),
      ],
    );
  }

  Widget _buildTextField(
    BuildContext context, {
    required String label,
    required TextEditingController controller,
    required Function(String) onChanged,
    String? error,
    bool isRequired = false,
    int maxLines = 1,
    int? maxLength,
    String? hintText,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 라벨
        Row(
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            if (isRequired) ...[
              const SizedBox(width: 4),
              Text(
                '*',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.error,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 8),

        // 텍스트 필드
        TextField(
          controller: controller,
          onChanged: onChanged,
          maxLines: maxLines,
          maxLength: maxLength,
          decoration: InputDecoration(
            hintText: hintText,
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(24),
              borderSide: BorderSide(
                color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
              ),
            ),
            counterText: '',
            errorText: error,
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(24),
              borderSide: BorderSide(
                color: Theme.of(context).colorScheme.error,
              ),
            ),
          ),
        ),
      ],
    );
  }

  // 숫자 스텝퍼 UI는 슬라이더로 대체됨

  Widget _buildTimeSlider(BuildContext context) {
    final double min = 10;
    final double max = 60;
    double value = widget.cookingTime.toDouble().clamp(min, max);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '요리시간',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            const Text('10'),
            Expanded(
              child: Slider(
                value: value,
                min: min,
                max: max,
                divisions: (max - min).toInt(),
                label: '${value.round()}분',
                onChanged: (v) => widget.onCookingTimeChanged(v.round()),
              ),
            ),
            const Text('60'),
          ],
        ),
      ],
    );
  }

  Widget _buildDifficultySelector(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '난이도',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 8),
        Row(
          children: RecipeDifficulty.values.map((diff) {
            final isSelected = widget.difficulty == diff;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: ChoiceChip(
                  label: Text(_getDifficultyText(diff)),
                  selected: isSelected,
                  onSelected: (_) => widget.onDifficultyChanged(diff),
                  selectedColor: Theme.of(context).colorScheme.primaryContainer,
                  backgroundColor:
                      Theme.of(context).colorScheme.surfaceContainerHighest,
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  String _getDifficultyText(RecipeDifficulty difficulty) {
    switch (difficulty) {
      case RecipeDifficulty.easy:
        return '쉬움';
      case RecipeDifficulty.medium:
        return '보통';
      case RecipeDifficulty.hard:
        return '어려움';
    }
  }
}
