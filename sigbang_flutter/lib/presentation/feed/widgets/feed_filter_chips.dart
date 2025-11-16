import 'package:flutter/material.dart';

class FeedFilterChips extends StatelessWidget {
  final List<String> selectedTags;
  final Function(List<String>) onTagsChanged;
  final VoidCallback? onClearAll;

  const FeedFilterChips({
    super.key,
    required this.selectedTags,
    required this.onTagsChanged,
    this.onClearAll,
  });

  // 더미 태그 데이터 (실제로는 API에서 가져와야 함)
  static const List<String> availableTags = [
    '한식',
    '일식',
    '중식',
    '양식',
    '이탈리안',
    '디저트',
    '간단요리',
    '30분 이내',
    '다이어트',
    '비건',
    '글루텐프리',
    '매운맛',
    '달콤한',
    '고기',
    '해산물',
    '야채',
  ];

  void _toggleTag(String tag) {
    final newTags = List<String>.from(selectedTags);
    if (newTags.contains(tag)) {
      newTags.remove(tag);
    } else {
      newTags.add(tag);
    }
    onTagsChanged(newTags);
  }

  @override
  Widget build(BuildContext context) {
    if (selectedTags.isEmpty && availableTags.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 선택된 태그들
          if (selectedTags.isNotEmpty) ...[
            Row(
              children: [
                Text(
                  '적용된 필터',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
                const Spacer(),
                TextButton(
                  onPressed: onClearAll,
                  child: Text(
                    '전체 해제',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.primary,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: selectedTags.map((tag) {
                return FilterChip(
                  label: Text(tag),
                  selected: true,
                  onSelected: (_) => _toggleTag(tag),
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
                  onDeleted: () => _toggleTag(tag),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
          ],
          // 사용 가능한 태그들
          Text(
            '카테고리',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: availableTags
                .where((tag) => !selectedTags.contains(tag))
                .map((tag) {
              return FilterChip(
                label: Text(tag),
                selected: false,
                onSelected: (_) => _toggleTag(tag),
                backgroundColor: Theme.of(context).colorScheme.surface,
                side: BorderSide(
                  color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
                ),
                labelStyle: TextStyle(
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
