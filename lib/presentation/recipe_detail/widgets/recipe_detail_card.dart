import 'package:flutter/material.dart';
import '../../../domain/entities/recipe.dart';
import 'recipe_image_gallery.dart';
import 'recipe_info_bar.dart';
import 'recipe_ingredients.dart';
import 'recipe_steps.dart';
import 'recipe_actions.dart';

class RecipeDetailCard extends StatelessWidget {
  final Recipe recipe;
  final bool isLoggedIn;
  final VoidCallback? onLikeTap;
  final VoidCallback? onSaveTap;
  final VoidCallback? onShareTap;

  const RecipeDetailCard({
    super.key,
    required this.recipe,
    required this.isLoggedIn,
    this.onLikeTap,
    this.onSaveTap,
    this.onShareTap,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // 스크롤 가능한 콘텐츠
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 이미지 갤러리
                  RecipeImageGallery(recipe: recipe),

                  // 레시피 기본 정보
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // 제목
                        Text(
                          recipe.title,
                          style: Theme.of(context)
                              .textTheme
                              .headlineMedium
                              ?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const SizedBox(height: 8),

                        // 설명
                        if (recipe.description.isNotEmpty) ...[
                          Text(
                            recipe.description,
                            style:
                                Theme.of(context).textTheme.bodyLarge?.copyWith(
                                      color: Theme.of(context)
                                          .colorScheme
                                          .onSurfaceVariant,
                                      height: 1.5,
                                    ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // 작성자 정보
                        if (recipe.author != null) ...[
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 20,
                                backgroundImage: recipe.author?.profileImage !=
                                        null
                                    ? NetworkImage(recipe.author!.profileImage!)
                                    : null,
                                child: recipe.author?.profileImage == null
                                    ? Icon(
                                        Icons.person,
                                        color: Theme.of(context)
                                            .colorScheme
                                            .onSurfaceVariant,
                                      )
                                    : null,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      recipe.author?.nickname ?? 'Unknown',
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleSmall
                                          ?.copyWith(
                                            fontWeight: FontWeight.w600,
                                          ),
                                    ),
                                    Text(
                                      '레시피 작성자',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(
                                            color: Theme.of(context)
                                                .colorScheme
                                                .onSurfaceVariant,
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                              TextButton(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('작성자 프로필 (구현 예정)'),
                                      duration: Duration(seconds: 1),
                                    ),
                                  );
                                },
                                child: const Text('프로필 보기'),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                        ],

                        // 레시피 정보 바
                        RecipeInfoBar(recipe: recipe),
                        const SizedBox(height: 24),

                        // 태그들
                        if (recipe.tags.isNotEmpty) ...[
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: recipe.tags.map((tag) {
                              return Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .primaryContainer,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Text(
                                  '${tag.emoji} ${tag.name}',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(
                                        color: Theme.of(context)
                                            .colorScheme
                                            .onPrimaryContainer,
                                        fontWeight: FontWeight.w500,
                                      ),
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 24),
                        ],

                        // 재료 섹션
                        RecipeIngredients(recipe: recipe),
                        const SizedBox(height: 32),

                        // 조리 과정 섹션
                        RecipeSteps(recipe: recipe),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 하단 액션 바
          RecipeActions(
            recipe: recipe,
            isLoggedIn: isLoggedIn,
            onLikeTap: onLikeTap,
            onSaveTap: onSaveTap,
            onShareTap: onShareTap,
          ),
        ],
      ),
    );
  }
}
