import 'package:flutter/material.dart';
import '../../../domain/entities/recipe.dart';
import '../../../core/config/env_config.dart';
import '../../common/login_required_dialog.dart';

class RecipeCard extends StatelessWidget {
  final Recipe recipe;
  final VoidCallback onTap;
  final bool isLoggedIn;
  final VoidCallback? onLikeTap;

  const RecipeCard({
    super.key,
    required this.recipe,
    required this.onTap,
    this.isLoggedIn = false,
    this.onLikeTap,
  });

  @override
  Widget build(BuildContext context) {
    final titleStyle = Theme.of(context).textTheme.titleSmall?.copyWith(
          fontWeight: FontWeight.bold,
        );
    final titleLineHeight =
        (titleStyle?.fontSize ?? 14) * (titleStyle?.height ?? 1.2);
    final String? profileImage = recipe.author?.profileImage;
    final String? resolvedProfileUrl = profileImage == null
        ? null
        : (profileImage.startsWith('http')
            ? profileImage
            : _joinUrl(EnvConfig.baseUrl, profileImage));
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 이미지 영역
            Flexible(
              flex: 3,
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                ),
                child: recipe.thumbnailUrl != null
                    ? _buildImage(recipe.thumbnailUrl!)
                    : _buildPlaceholder(),
              ),
            ),
            // 정보 영역
            Flexible(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 제목
                    SizedBox(
                      height: titleLineHeight,
                      child: Align(
                        alignment: Alignment.topLeft,
                        child: Text(
                          recipe.title,
                          style: titleStyle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    // 설명 (제목 아래 1줄 고정)
                    Text(
                      recipe.description,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[700],
                          ),
                    ),
                    const SizedBox(height: 4),
                    // 작성자 아바타 + 좋아요 (4번째 줄)
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        if (resolvedProfileUrl != null)
                          CircleAvatar(
                            radius: 10,
                            backgroundImage: NetworkImage(resolvedProfileUrl),
                            backgroundColor: Colors.transparent,
                          ),
                        const Spacer(),
                        InkWell(
                          borderRadius: BorderRadius.circular(6),
                          onTap: () {
                            if (!isLoggedIn) {
                              showLoginRequiredDialog(context);
                              return;
                            }
                            if (onLikeTap != null) {
                              onLikeTap!();
                            }
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.favorite,
                                  size: 14,
                                  color: recipe.isLiked ? Colors.red : Colors.grey,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '${recipe.likesCount}',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImage(String imageUrl) {
    // assets 이미지인지 네트워크 이미지인지 확인
    if (imageUrl.startsWith('assets/')) {
      return Image.asset(
        imageUrl,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
      );
    } else {
      final resolvedUrl = imageUrl.startsWith('http')
          ? imageUrl
          : _joinUrl(EnvConfig.baseUrl, imageUrl);
      return Image.network(
        resolvedUrl,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
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
  }

  String _joinUrl(String base, String path) {
    final b = base.endsWith('/') ? base.substring(0, base.length - 1) : base;
    final p = path.startsWith('/') ? path.substring(1) : path;
    return '$b/$p';
  }

  Widget _buildPlaceholder() {
    return Container(
      color: Colors.grey[200],
      child: const Center(
        child: Icon(
          Icons.restaurant_menu,
          size: 48,
          color: Colors.grey,
        ),
      ),
    );
  }
}
