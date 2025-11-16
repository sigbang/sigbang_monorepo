import 'package:flutter/material.dart';
import '../../../domain/entities/recipe.dart';
import '../../../presentation/session/session_cubit.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/utils/action_guard.dart';

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

    return BlocBuilder<SessionCubit, SessionState>(
      builder: (context, sessionState) {
        final canLike = ActionGuard.canPerform(
            sessionState.user?.status, ActionType.likeRecipe);
        final canSave = ActionGuard.canPerform(
            sessionState.user?.status, ActionType.saveRecipe);

        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // 시간
            Row(
              children: [
                Icon(Icons.access_time_filled_rounded,
                    size: 22, color: iconColor),
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
              onTap: canLike
                  ? onLikeTap
                  : () {
                      if (!canLike && sessionState.user != null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                              content: Text(ActionGuard.getRestrictionMessage(
                                  ActionType.likeRecipe))),
                        );
                      }
                    },
              borderRadius: BorderRadius.circular(6),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Row(
                  children: [
                    Icon(
                      recipe.isLiked ? Icons.favorite : Icons.favorite_border,
                      size: 24,
                      color: !canLike
                          ? Theme.of(context).disabledColor
                          : iconColor,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _formatCount(recipe.likesCount),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: !canLike
                                ? Theme.of(context).disabledColor
                                : subtleColor,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ),
              ),
            ),

            // 저장 버튼 (아이콘만)
            InkWell(
              onTap: canSave
                  ? onSaveTap
                  : () {
                      if (!canSave && sessionState.user != null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                              content: Text(ActionGuard.getRestrictionMessage(
                                  ActionType.saveRecipe))),
                        );
                      }
                    },
              borderRadius: BorderRadius.circular(8),
              child: Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: recipe.isSaved && canSave
                      ? Colors.amber
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                  border: recipe.isSaved
                      ? null
                      : Border.all(
                          color: !canSave
                              ? Theme.of(context).disabledColor
                              : colorScheme.onSurface,
                          width: 1.2,
                        ),
                ),
                child: Icon(
                  recipe.isSaved ? Icons.bookmark : Icons.bookmark_border,
                  size: 20,
                  color: recipe.isSaved && canSave
                      ? Colors.black
                      : (!canSave
                          ? Theme.of(context).disabledColor
                          : iconColor),
                ),
              ),
            ),
          ],
        );
      },
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
