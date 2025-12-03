import 'package:flutter/material.dart';
import '../../../domain/entities/recipe.dart';
import '../../../core/config/env_config.dart';
import '../../common/login_required_dialog.dart';

class RecipeListItem extends StatelessWidget {
  final Recipe recipe;
  final VoidCallback? onTap;
  final bool isLoggedIn;
  final VoidCallback? onLikeTap;
  final VoidCallback? onSaveTap;

  const RecipeListItem({
    super.key,
    required this.recipe,
    this.onTap,
    this.isLoggedIn = false,
    this.onLikeTap,
    this.onSaveTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 레시피 이미지
            if (recipe.thumbnailUrl != null)
              ClipRRect(
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(8)),
                child: AspectRatio(
                  aspectRatio: 16 / 9,
                  child: _buildImage(context, recipe.thumbnailUrl!),
                ),
              )
            else
              Container(
                height: 200,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius:
                      const BorderRadius.vertical(top: Radius.circular(8)),
                ),
                child: Icon(
                  Icons.restaurant,
                  size: 48,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),

            // 레시피 정보
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 제목
                  Text(
                    recipe.title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),

                  // 설명
                  if (recipe.description.isNotEmpty)
                    Text(
                      recipe.description,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: 12),

                  // 작성자 정보
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 16,
                        backgroundImage: recipe.author?.profileImage != null
                            ? NetworkImage(recipe.author!.profileImage!)
                            : null,
                        child: recipe.author?.profileImage == null
                            ? Icon(
                                Icons.person,
                                size: 20,
                                color: Theme.of(context)
                                    .colorScheme
                                    .onSurfaceVariant,
                              )
                            : null,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          recipe.author?.nickname ?? 'Unknown',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurfaceVariant,
                                    fontWeight: FontWeight.w500,
                                  ),
                        ),
                      ),
                      // 요리 시간
                      Icon(
                        Icons.access_time,
                        size: 16,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${recipe.cookingTime}분',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurfaceVariant,
                            ),
                      ),
                    ],
                  ),
                  // 요리 정보 및 액션
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(width: 4),
                      Text(
                        '조회수 ${recipe.viewCount}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurfaceVariant,
                            ),
                      ),

                      const SizedBox(width: 16),
                      const Spacer(),

                      // 좋아요 버튼
                      IconButton(
                        iconSize: 28,
                        padding: EdgeInsets.zero,
                        constraints:
                            const BoxConstraints(minWidth: 28, minHeight: 28),
                        visualDensity:
                            const VisualDensity(horizontal: -1, vertical: -2),
                        icon: Icon(
                          recipe.isLiked
                              ? Icons.favorite
                              : Icons.favorite_border,
                          color: recipe.isLiked
                              ? Colors.red
                              : Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                        onPressed: () {
                          if (!isLoggedIn) {
                            showLoginRequiredDialog(context);
                            return;
                          }
                          if (onLikeTap != null) {
                            onLikeTap!();
                          }
                        },
                      ),
                      Text(
                        '${recipe.likesCount}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              fontWeight: FontWeight.w600,
                              fontSize: (Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.fontSize ??
                                      12) +
                                  2,
                            ),
                      ),
                      const SizedBox(width: 4),

                      // 저장 버튼
                      IconButton(
                        iconSize: 28,
                        padding: EdgeInsets.zero,
                        constraints:
                            const BoxConstraints(minWidth: 32, minHeight: 32),
                        visualDensity:
                            const VisualDensity(horizontal: -4, vertical: -2),
                        icon: Icon(
                          recipe.isSaved
                              ? Icons.bookmark
                              : Icons.bookmark_border,
                          color: recipe.isSaved
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                        onPressed: () {
                          if (!isLoggedIn) {
                            showLoginRequiredDialog(context);
                            return;
                          }
                          if (onSaveTap != null) {
                            onSaveTap!();
                          }
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImage(BuildContext context, String imageUrl) {
    // 에셋 경로 처리
    if (imageUrl.startsWith('assets/')) {
      return Image.asset(
        imageUrl,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) =>
            _buildPlaceholder(context),
      );
    }

    // 상대 경로 처리 -> 서버 baseUrl 프리픽스
    final resolvedUrl = imageUrl.startsWith('http')
        ? imageUrl
        : _joinUrl(EnvConfig.baseUrl, imageUrl);

    return Image.network(
      resolvedUrl,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) => _buildPlaceholder(context),
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) return child;
        return Center(
          child: CircularProgressIndicator(
            value: loadingProgress.expectedTotalBytes != null
                ? loadingProgress.cumulativeBytesLoaded /
                    loadingProgress.expectedTotalBytes!
                : null,
          ),
        );
      },
    );
  }

  String _joinUrl(String base, String path) {
    final b = base.endsWith('/') ? base.substring(0, base.length - 1) : base;
    final p = path.startsWith('/') ? path.substring(1) : path;
    return '$b/$p';
  }

  Widget _buildPlaceholder(BuildContext context) {
    return Container(
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: Icon(
        Icons.restaurant,
        size: 48,
        color: Theme.of(context).colorScheme.onSurfaceVariant,
      ),
    );
  }
}
