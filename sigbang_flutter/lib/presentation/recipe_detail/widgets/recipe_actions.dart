import 'package:flutter/material.dart';
import '../../../domain/entities/recipe.dart';

class RecipeActions extends StatelessWidget {
  final Recipe recipe;
  final bool isLoggedIn;
  final VoidCallback? onLikeTap;
  final VoidCallback? onSaveTap;
  final VoidCallback? onShareTap;

  const RecipeActions({
    super.key,
    required this.recipe,
    required this.isLoggedIn,
    this.onLikeTap,
    this.onSaveTap,
    this.onShareTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          top: BorderSide(
            color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
          ),
        ),
      ),
      child: Row(
        children: [
          // 좋아요 버튼
          Expanded(
            child: _buildActionButton(
              context,
              icon: recipe.isLiked ? Icons.favorite : Icons.favorite_border,
              label: '좋아요 ${recipe.likesCount}',
              color: recipe.isLiked ? Colors.red : null,
              onTap: isLoggedIn
                  ? (onLikeTap ?? () {})
                  : () => _showLoginRequired(context),
            ),
          ),

          const SizedBox(width: 8),

          // 저장 버튼
          Expanded(
            child: _buildActionButton(
              context,
              icon: recipe.isSaved ? Icons.bookmark : Icons.bookmark_border,
              label: '저장',
              color:
                  recipe.isSaved ? Theme.of(context).colorScheme.primary : null,
              onTap: isLoggedIn
                  ? (onSaveTap ?? () {})
                  : () => _showLoginRequired(context),
            ),
          ),

          const SizedBox(width: 8),

          // 공유 버튼
          Expanded(
            child: _buildActionButton(
              context,
              icon: Icons.share,
              label: '공유',
              onTap: onShareTap ?? () => _showShareOptions(context),
            ),
          ),

          const SizedBox(width: 8),

          // 댓글 버튼
          Expanded(
            child: _buildActionButton(
              context,
              icon: Icons.comment_outlined,
              label: '댓글 ${recipe.commentsCount}',
              onTap: () => _showComingSoon(context),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(
    BuildContext context, {
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Color? color,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: color ?? Theme.of(context).colorScheme.onSurfaceVariant,
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color:
                        color ?? Theme.of(context).colorScheme.onSurfaceVariant,
                    fontSize: 10,
                  ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  void _showLoginRequired(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('로그인이 필요한 기능입니다'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _showShareOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '공유하기',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.link),
              title: const Text('링크 복사'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('링크가 복사되었습니다'),
                    duration: Duration(seconds: 2),
                  ),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.share),
              title: const Text('다른 앱으로 공유'),
              onTap: () {
                Navigator.pop(context);
                _showComingSoon(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showComingSoon(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('곧 구현될 예정입니다'),
        duration: Duration(seconds: 2),
      ),
    );
  }
}
