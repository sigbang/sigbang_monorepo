import 'package:flutter/material.dart';
import '../../../domain/entities/recipe.dart';

class RecipeMetaRow extends StatelessWidget {
  final Recipe recipe;
  final VoidCallback? onLikeTap;
  final VoidCallback? onSaveTap;

  const RecipeMetaRow({
    super.key,
    required this.recipe,
    this.onLikeTap,
    this.onSaveTap,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final iconColor = colorScheme.onSurface;
    final subtleColor = colorScheme.onSurface;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // 시간
        Row(
          children: [
            Icon(Icons.access_time_filled_rounded, size: 22, color: iconColor),
            const SizedBox(width: 8),
            Text(
              '${recipe.cookingTime ?? '-'} 분',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: subtleColor,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
        ),

        // 좋아요 카운트
        InkWell(
          onTap: onLikeTap,
          borderRadius: BorderRadius.circular(6),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            child: Row(
              children: [
                Icon(
                  recipe.isLiked ? Icons.favorite : Icons.favorite_border,
                  size: 24,
                  color: iconColor,
                ),
                const SizedBox(width: 8),
                Text(
                  _formatCount(recipe.likesCount),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: subtleColor,
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ],
            ),
          ),
        ),

        // 저장 버튼 (아이콘만)
        InkWell(
          onTap: onSaveTap,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: recipe.isSaved ? Colors.amber : Colors.transparent,
              borderRadius: BorderRadius.circular(8),
              border: recipe.isSaved
                  ? null
                  : Border.all(color: colorScheme.onSurface, width: 1.2),
            ),
            child: Icon(
              recipe.isSaved ? Icons.bookmark : Icons.bookmark_border,
              size: 20,
              color: recipe.isSaved ? Colors.black : iconColor,
            ),
          ),
        ),
      ],
    );
  }

  String _formatCount(int n) {
    if (n >= 1000000) {
      return '${(n / 1000000).toStringAsFixed(1)}M';
    }
    if (n >= 1000) {
      return '${(n / 1000).toStringAsFixed(1)}K';
    }
    return '$n';
  }
}
