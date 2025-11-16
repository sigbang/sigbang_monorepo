import 'package:flutter/material.dart';
import '../../../core/config/env_config.dart';
import '../../../domain/entities/recipe.dart';

class RecipeImageGallery extends StatefulWidget {
  final Recipe recipe;

  const RecipeImageGallery({
    super.key,
    required this.recipe,
  });

  @override
  State<RecipeImageGallery> createState() => _RecipeImageGalleryState();
}

class _RecipeImageGalleryState extends State<RecipeImageGallery> {
  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  List<String> get _images {
    // 썸네일만 노출
    if (widget.recipe.thumbnailUrl != null) {
      return [widget.recipe.thumbnailUrl!];
    }
    return const [];
  }

  @override
  Widget build(BuildContext context) {
    final images = _images;

    if (images.isEmpty) {
      return _buildPlaceholder();
    }

    // 단일 썸네일만 노출
    return SizedBox(
      height: 300,
      width: double.infinity,
      child: GestureDetector(
        onTap: () => _showFullScreenImage(images.first),
        child: _buildImage(images.first, fit: BoxFit.cover, expand: true),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      height: 300,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.restaurant,
              size: 64,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 8),
            Text(
              '이미지가 없습니다',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showFullScreenImage(String imageUrl) {
    showDialog(
      context: context,
      barrierColor: Colors.black87,
      builder: (context) => Dialog.fullscreen(
        backgroundColor: Colors.black,
        child: Stack(
          children: [
            Center(
              child: InteractiveViewer(
                child: _buildImage(imageUrl,
                    fit: BoxFit.contain, fullscreen: true),
              ),
            ),
            Positioned(
              top: 40,
              right: 16,
              child: IconButton(
                icon: const Icon(
                  Icons.close,
                  color: Colors.white,
                  size: 32,
                ),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _resolveUrl(String url) {
    if (url.startsWith('assets/')) return url; // 에셋 경로는 그대로 사용
    if (url.startsWith('http')) return url;
    final b = EnvConfig.baseUrl.endsWith('/')
        ? EnvConfig.baseUrl.substring(0, EnvConfig.baseUrl.length - 1)
        : EnvConfig.baseUrl;
    final p = url.startsWith('/') ? url.substring(1) : url;
    return '$b/$p';
  }

  Widget _buildImage(String src,
      {BoxFit fit = BoxFit.cover,
      bool fullscreen = false,
      bool expand = false}) {
    if (src.startsWith('assets/')) {
      return Image.asset(
        src,
        fit: fit,
        width: expand ? double.infinity : null,
        height: expand ? double.infinity : null,
        errorBuilder: (context, error, stackTrace) {
          return fullscreen
              ? const _FullScreenErrorIcon()
              : _buildPlaceholder();
        },
      );
    }

    return Image.network(
      _resolveUrl(src),
      fit: fit,
      width: expand ? double.infinity : null,
      height: expand ? double.infinity : null,
      errorBuilder: (context, error, stackTrace) {
        return fullscreen ? const _FullScreenErrorIcon() : _buildPlaceholder();
      },
    );
  }
}

class _FullScreenErrorIcon extends StatelessWidget {
  const _FullScreenErrorIcon();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Icon(
        Icons.error_outline,
        color: Colors.white,
        size: 64,
      ),
    );
  }
}
