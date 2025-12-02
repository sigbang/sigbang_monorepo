import 'package:flutter/material.dart';
import '../../../domain/entities/recipe.dart';
import 'recipe_image_gallery.dart';
import 'recipe_meta_row.dart';
import 'recipe_author_header.dart';
import 'recipe_ingredients.dart';
import 'recipe_steps.dart';

class RecipeDetailCard extends StatelessWidget {
  final Recipe recipe;
  final bool isLoggedIn;
  final String? currentUserId;
  final VoidCallback? onLikeTap;
  final VoidCallback? onSaveTap;
  final VoidCallback? onShareTap;

  const RecipeDetailCard({
    super.key,
    required this.recipe,
    required this.isLoggedIn,
    this.currentUserId,
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
                  // 작성자 헤더
                  if (recipe.author != null)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                      child: RecipeAuthorHeader(
                        author: recipe.author!,
                        isLoggedIn: isLoggedIn,
                        showFollowButton: !(currentUserId != null &&
                            recipe.author?.id == currentUserId),
                      ),
                    ),

                  const SizedBox(height: 6),
                  // 이미지 갤러리
                  RecipeImageGallery(recipe: recipe),
                  const SizedBox(height: 6),

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
                        const SizedBox(height: 12),

                        // 메타 정보 (시간/좋아요/저장)
                        RecipeMetaRow(
                          recipe: recipe,
                          onLikeTap: onLikeTap,
                          onSaveTap: onSaveTap,
                          onShareTap: onShareTap,
                        ),

                        // 설명
                        if (recipe.description.isNotEmpty) ...[
                          const SizedBox(height: 12),
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
                        const SizedBox(height: 12),

                        // 외부 링크 섹션 (자료 구입/참고 링크)
                        if ((recipe.linkTitle ?? recipe.linkUrl) != null) ...[
                          Container(
                            decoration: BoxDecoration(
                              color: Theme.of(context)
                                  .colorScheme
                                  .surfaceContainerHighest
                                  .withOpacity(0.3),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: ListTile(
                              leading: Icon(
                                Icons.link,
                                color: Theme.of(context).colorScheme.primary,
                              ),
                              title: Text(
                                recipe.linkTitle ?? '자료 구입하러 가기',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(fontWeight: FontWeight.w600),
                              ),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      recipe.linkUrl ?? '링크가 준비되지 않았습니다',
                                    ),
                                    duration: const Duration(seconds: 2),
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(height: 24),
                        ],

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
        ],
      ),
    );
  }
}
