import 'package:flutter/material.dart';
import '../../../domain/entities/recipe.dart';

class TagSelector extends StatelessWidget {
  final List<RecipeTag> selectedTags;
  final Function(RecipeTag) onTagToggle;

  const TagSelector({
    super.key,
    required this.selectedTags,
    required this.onTagToggle,
  });

  // 사용 가능한 태그들 (실제로는 API에서 가져와야 함)
  static const List<RecipeTag> availableTags = [
    RecipeTag(name: '한식', emoji: '🇰🇷'),
    RecipeTag(name: '일식', emoji: '🇯🇵'),
    RecipeTag(name: '중식', emoji: '🇨🇳'),
    RecipeTag(name: '양식', emoji: '🍝'),
    RecipeTag(name: '이탈리안', emoji: '🇮🇹'),
    RecipeTag(name: '디저트', emoji: '🍰'),
    RecipeTag(name: '간단요리', emoji: '⚡'),
    RecipeTag(name: '30분 이내', emoji: '⏰'),
    RecipeTag(name: '다이어트', emoji: '🥗'),
    RecipeTag(name: '비건', emoji: '🌱'),
    RecipeTag(name: '글루텐프리', emoji: '🚫'),
    RecipeTag(name: '매운맛', emoji: '🌶️'),
    RecipeTag(name: '달콤한', emoji: '🍯'),
    RecipeTag(name: '고기', emoji: '🥩'),
    RecipeTag(name: '해산물', emoji: '🦐'),
    RecipeTag(name: '야채', emoji: '🥬'),
    RecipeTag(name: '국물요리', emoji: '🍲'),
    RecipeTag(name: '볶음요리', emoji: '🍳'),
    RecipeTag(name: '찜요리', emoji: '🥟'),
    RecipeTag(name: '구이요리', emoji: '🔥'),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 헤더
        Row(
          children: [
            Icon(
              Icons.local_offer,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(width: 8),
            Text(
              '태그',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 8),

        Text(
          '레시피를 더 쉽게 찾을 수 있도록 태그를 선택해주세요 (최대 5개)',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
        const SizedBox(height: 16),

        // 선택된 태그들
        if (selectedTags.isNotEmpty) ...[
          Text(
            '선택된 태그 (${selectedTags.length}/5)',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Theme.of(context).colorScheme.primary,
                ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: selectedTags.map((tag) {
              return FilterChip(
                label: Text('${tag.emoji} ${tag.name}'),
                selected: true,
                onSelected: (_) => onTagToggle(tag),
                selectedColor: Theme.of(context).colorScheme.primaryContainer,
                checkmarkColor:
                    Theme.of(context).colorScheme.onPrimaryContainer,
                labelStyle: TextStyle(
                  color: Theme.of(context).colorScheme.onPrimaryContainer,
                  fontWeight: FontWeight.w500,
                ),
                deleteIcon: Icon(
                  Icons.close,
                  size: 16,
                  color: Theme.of(context).colorScheme.onPrimaryContainer,
                ),
                onDeleted: () => onTagToggle(tag),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
        ],

        // 사용 가능한 태그들
        Text(
          '태그 선택',
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
        const SizedBox(height: 8),

        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: availableTags
              .where((tag) =>
                  !selectedTags.any((selected) => selected.name == tag.name))
              .map((tag) {
            final canSelect = selectedTags.length < 5;

            return FilterChip(
              label: Text('${tag.emoji} ${tag.name}'),
              selected: false,
              onSelected: canSelect ? (_) => onTagToggle(tag) : null,
              backgroundColor: canSelect
                  ? Theme.of(context).colorScheme.surface
                  : Theme.of(context)
                      .colorScheme
                      .surfaceContainerHighest
                      .withOpacity(0.5),
              side: BorderSide(
                color: canSelect
                    ? Theme.of(context).colorScheme.outline.withOpacity(0.3)
                    : Theme.of(context).colorScheme.outline.withOpacity(0.1),
              ),
              labelStyle: TextStyle(
                color: canSelect
                    ? Theme.of(context).colorScheme.onSurface
                    : Theme.of(context)
                        .colorScheme
                        .onSurfaceVariant
                        .withOpacity(0.5),
              ),
            );
          }).toList(),
        ),

        // 제한 안내
        if (selectedTags.length >= 5) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.secondaryContainer,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.info,
                  color: Theme.of(context).colorScheme.onSecondaryContainer,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '최대 5개까지만 선택할 수 있습니다. 다른 태그를 선택하려면 기존 태그를 제거해주세요.',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onSecondaryContainer,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
