import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/config/env_config.dart';
import '../../../domain/entities/recipe.dart';
import '../../../data/models/link_preview_model.dart';
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
                          _LinkPreviewSection(recipe: recipe),
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

class _LinkPreviewSection extends StatefulWidget {
  final Recipe recipe;

  const _LinkPreviewSection({required this.recipe});

  @override
  State<_LinkPreviewSection> createState() => _LinkPreviewSectionState();
}

class _LinkPreviewSectionState extends State<_LinkPreviewSection> {
  Future<LinkPreview?>? _future;
  bool _renderedLogged = false;

  @override
  void initState() {
    super.initState();
    final url = widget.recipe.linkUrl;
    if (url != null && url.trim().isNotEmpty) {
      _future = _fetchLinkPreview(url);
      _logEvent(type: 'RENDERED', url: url.trim());
    }
  }

  Future<LinkPreview?> _fetchLinkPreview(String url) async {
    final trimmed = url.trim();
    if (trimmed.isEmpty || !trimmed.startsWith('http')) {
      return null;
    }

    final endpoint =
        '${EnvConfig.siteUrl}/api/link-preview?url=${Uri.encodeComponent(trimmed)}';

    try {
      final dio = Dio(
        BaseOptions(
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        ),
      );
      final response = await dio.get(endpoint);
      if (response.statusCode == 200 && response.data is Map<String, dynamic>) {
        return LinkPreview.fromJson(response.data as Map<String, dynamic>);
      }
    } catch (e) {
      if (kDebugMode) {
        // ignore: avoid_print
        print('Link preview fetch failed: $e');
      }
    }
    return null;
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    await launchUrl(uri, mode: LaunchMode.inAppBrowserView);
  }

  Future<void> _logEvent({
    required String type,
    required String url,
    String? finalUrl,
  }) async {
    if (type == 'RENDERED') {
      if (_renderedLogged) return;
      _renderedLogged = true;
    }

    final endpoint =
        '${EnvConfig.baseUrl}/recipes/${widget.recipe.id}/external-link-events';
    try {
      final dio = Dio(
        BaseOptions(
          connectTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
          headers: {'Content-Type': 'application/json'},
        ),
      );
      await dio.post(endpoint, data: {
        'type': type,
        'actionType': type == 'CLICKED' ? 'click' : null,
        'isAutoRedirect': false,
        'url': url,
        'finalUrl': finalUrl,
      });
    } catch (_) {
      // ignore
    }
  }

  @override
  Widget build(BuildContext context) {
    final baseUrl = widget.recipe.linkUrl;
    if (baseUrl == null || baseUrl.trim().isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context)
            .colorScheme
            .surfaceContainerHighest
            .withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: FutureBuilder<LinkPreview?>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        Theme.of(context).colorScheme.primary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      widget.recipe.linkTitle ?? '링크 미리보기를 불러오는 중...',
                      style: Theme.of(context).textTheme.titleMedium,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            );
          }

          final preview = snapshot.data;

          final targetUrl = preview?.finalUrl ??
              ((preview != null && preview.url.isNotEmpty)
                  ? preview.url
                  : baseUrl);

          // P0: preview is NOT clickable; CTA button only
          return Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    (preview?.image != null && preview!.image!.isNotEmpty)
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              preview.image!,
                              width: 48,
                              height: 48,
                              fit: BoxFit.cover,
                            ),
                          )
                        : Icon(
                            Icons.link,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            preview?.title ??
                                widget.recipe.linkTitle ??
                                '자료 구입하러 가기',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(fontWeight: FontWeight.w600),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if ((preview?.siteName ?? '').trim().isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(
                                preview!.siteName!,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(
                                      color: Theme.of(context)
                                          .colorScheme
                                          .onSurfaceVariant,
                                    ),
                              ),
                            ),
                          if ((preview?.description ?? '').trim().isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(
                                preview!.description!,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(
                                      color: Theme.of(context)
                                          .colorScheme
                                          .onSurfaceVariant,
                                    ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      await _logEvent(
                        type: 'CLICKED',
                        url: baseUrl.trim(),
                        finalUrl: preview?.finalUrl ?? preview?.url,
                      );
                      await _openUrl(targetUrl);
                    },
                    child: const Text('외부 구매처로 이동'),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
