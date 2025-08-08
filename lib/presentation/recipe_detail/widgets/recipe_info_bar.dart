import 'package:flutter/material.dart';
import '../../../domain/entities/recipe.dart';

class RecipeInfoBar extends StatelessWidget {
  final Recipe recipe;

  const RecipeInfoBar({
    super.key,
    required this.recipe,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          // 요리 시간
          Expanded(
            child: _buildInfoItem(
              context,
              icon: Icons.access_time,
              label: '조리시간',
              value: '${recipe.cookingTime}분',
            ),
          ),

          const SizedBox(width: 16),

          // 인분
          Expanded(
            child: _buildInfoItem(
              context,
              icon: Icons.people,
              label: '인분',
              value: '${recipe.servings}인분',
            ),
          ),

          const SizedBox(width: 16),

          // 난이도
          Expanded(
            child: _buildInfoItem(
              context,
              icon: Icons.signal_cellular_alt,
              label: '난이도',
              value: _getDifficultyText(recipe.difficulty),
            ),
          ),

          const SizedBox(width: 16),

          // 조회수
          Expanded(
            child: _buildInfoItem(
              context,
              icon: Icons.visibility,
              label: '조회',
              value: '${recipe.viewCount}',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Icon(
          icon,
          size: 24,
          color: Theme.of(context).colorScheme.primary,
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.onSurface,
              ),
        ),
      ],
    );
  }

  String _getDifficultyText(dynamic difficulty) {
    if (difficulty == null) return '보통';

    // RecipeDifficulty enum인 경우
    final difficultyStr = difficulty.toString();
    if (difficultyStr.contains('RecipeDifficulty.')) {
      final enumValue = difficultyStr.split('.').last;
      switch (enumValue.toLowerCase()) {
        case 'easy':
          return '쉬움';
        case 'medium':
          return '보통';
        case 'hard':
          return '어려움';
        default:
          return '보통';
      }
    }

    // String인 경우
    switch (difficulty.toString().toLowerCase()) {
      case 'easy':
        return '쉬움';
      case 'medium':
        return '보통';
      case 'hard':
        return '어려움';
      default:
        return difficulty.toString();
    }
  }
}
