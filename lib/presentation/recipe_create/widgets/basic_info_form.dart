import 'package:flutter/material.dart';
import '../../../domain/entities/recipe.dart';

class BasicInfoForm extends StatelessWidget {
  final String title;
  final String description;
  final String ingredients;
  final int cookingTime;
  final int servings;
  final RecipeDifficulty difficulty;
  final Map<String, String?> errors;
  final Function(String) onTitleChanged;
  final Function(String) onDescriptionChanged;
  final Function(String) onIngredientsChanged;
  final Function(int) onCookingTimeChanged;
  final Function(int) onServingsChanged;
  final Function(RecipeDifficulty) onDifficultyChanged;

  const BasicInfoForm({
    super.key,
    required this.title,
    required this.description,
    required this.ingredients,
    required this.cookingTime,
    required this.servings,
    required this.difficulty,
    required this.errors,
    required this.onTitleChanged,
    required this.onDescriptionChanged,
    required this.onIngredientsChanged,
    required this.onCookingTimeChanged,
    required this.onServingsChanged,
    required this.onDifficultyChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 제목
        _buildTextField(
          context,
          label: '레시피 제목',
          value: title,
          onChanged: onTitleChanged,
          error: errors['title'],
          isRequired: true,
          maxLength: 50,
          hintText: '맛있는 레시피 제목을 입력하세요',
        ),
        const SizedBox(height: 24),

        // 설명
        _buildTextField(
          context,
          label: '레시피 설명',
          value: description,
          onChanged: onDescriptionChanged,
          error: errors['description'],
          isRequired: true,
          maxLines: 3,
          maxLength: 200,
          hintText: '레시피에 대한 간단한 설명을 입력하세요',
        ),
        const SizedBox(height: 24),

        // 재료
        _buildTextField(
          context,
          label: '재료',
          value: ingredients,
          onChanged: onIngredientsChanged,
          error: errors['ingredients'],
          isRequired: true,
          maxLines: 5,
          maxLength: 500,
          hintText: '예:\n- 돼지고기 200g\n- 양파 1개\n- 간장 2큰술\n- 마늘 3쪽',
        ),
        const SizedBox(height: 24),

        // 요리 정보 행
        Row(
          children: [
            // 조리 시간
            Expanded(
              child: _buildNumberField(
                context,
                label: '조리 시간',
                value: cookingTime,
                onChanged: onCookingTimeChanged,
                suffix: '분',
                min: 5,
                max: 300,
              ),
            ),
            const SizedBox(width: 16),

            // 인분
            Expanded(
              child: _buildNumberField(
                context,
                label: '인분',
                value: servings,
                onChanged: onServingsChanged,
                suffix: '인분',
                min: 1,
                max: 10,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // 난이도
        _buildDifficultySelector(context),
      ],
    );
  }

  Widget _buildTextField(
    BuildContext context, {
    required String label,
    required String value,
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
          controller: TextEditingController(text: value)
            ..selection = TextSelection.fromPosition(
              TextPosition(offset: value.length),
            ),
          onChanged: onChanged,
          maxLines: maxLines,
          maxLength: maxLength,
          decoration: InputDecoration(
            hintText: hintText,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            errorText: error,
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: Theme.of(context).colorScheme.error,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNumberField(
    BuildContext context, {
    required String label,
    required int value,
    required Function(int) onChanged,
    required String suffix,
    int min = 1,
    int max = 100,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            // 감소 버튼
            IconButton(
              onPressed: value > min ? () => onChanged(value - 1) : null,
              icon: const Icon(Icons.remove),
              style: IconButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
              ),
            ),

            // 값 표시
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  border: Border.all(
                    color: Theme.of(context).colorScheme.outline,
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$value$suffix',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
            ),

            // 증가 버튼
            IconButton(
              onPressed: value < max ? () => onChanged(value + 1) : null,
              icon: const Icon(Icons.add),
              style: IconButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
              ),
            ),
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
            final isSelected = difficulty == diff;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: ChoiceChip(
                  label: Text(_getDifficultyText(diff)),
                  selected: isSelected,
                  onSelected: (_) => onDifficultyChanged(diff),
                  selectedColor: Theme.of(context).colorScheme.primaryContainer,
                  backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
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
