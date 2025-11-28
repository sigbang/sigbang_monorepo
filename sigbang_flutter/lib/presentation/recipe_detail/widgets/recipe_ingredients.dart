import 'package:flutter/material.dart';
import '../../../domain/entities/recipe.dart';

class RecipeIngredients extends StatelessWidget {
  final Recipe recipe;

  const RecipeIngredients({
    super.key,
    required this.recipe,
  });

  @override
  Widget build(BuildContext context) {
    final rawIngredients = (recipe.ingredients ?? '').trim();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '재료',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 16),
        if (rawIngredients.isEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                '재료 정보가 없습니다',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          )
        else
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(
                color: Theme.of(context).colorScheme.outline,
              ),
              borderRadius: BorderRadius.circular(8),
              color: Theme.of(context).colorScheme.surface,
            ),
            child: Text(
              rawIngredients,
              softWrap: true,
              overflow: TextOverflow.visible,
              textAlign: TextAlign.start,
              textWidthBasis: TextWidthBasis.parent,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    height: 1.5,
                  ),
            ),
          ),
      ],
    );
  }
}
