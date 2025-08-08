import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../injection/injection.dart';
import '../cubits/recipe_detail_cubit.dart';
import '../cubits/recipe_detail_state.dart';
import '../widgets/recipe_detail_card.dart';

class RecipeDetailPage extends StatelessWidget {
  final String recipeId;
  final String? feedQuery;
  final List<String> tags;

  const RecipeDetailPage({
    super.key,
    required this.recipeId,
    this.feedQuery,
    this.tags = const [],
  });

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => getIt<RecipeDetailCubit>()
        ..loadRecipeDetail(recipeId, feedQuery: feedQuery, tags: tags),
      child: const RecipeDetailView(),
    );
  }
}

class RecipeDetailView extends StatefulWidget {
  const RecipeDetailView({super.key});

  @override
  State<RecipeDetailView> createState() => _RecipeDetailViewState();
}

class _RecipeDetailViewState extends State<RecipeDetailView> {
  late PageController _pageController;
  bool _isFirstPage = true;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<RecipeDetailCubit, RecipeDetailState>(
      listener: (context, state) {
        if (state is RecipeDetailLoaded) {
          // 첫 페이지 여부 업데이트
          setState(() {
            _isFirstPage = state.currentIndex == 0;
          });

          // 뷰카운트 증가 (한 번만)
          if (state.currentIndex == 0) {
            context.read<RecipeDetailCubit>().incrementViewCount();
          }
        }
      },
      builder: (context, state) {
        return Scaffold(
          backgroundColor: Theme.of(context).colorScheme.surface,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: _isFirstPage
                ? IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => Navigator.of(context).pop(),
                  )
                : null,
            automaticallyImplyLeading: _isFirstPage,
            title: state is RecipeDetailLoaded
                ? Column(
                    children: [
                      Text(
                        state.currentRecipe.title,
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (state.recipes.length > 1)
                        Text(
                          '${state.currentIndex + 1} / ${state.recipes.length}',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurfaceVariant,
                                  ),
                        ),
                    ],
                  )
                : const Text('레시피'),
            centerTitle: true,
            actions: [
              // 더보기 메뉴
              PopupMenuButton<String>(
                onSelected: (value) {
                  switch (value) {
                    case 'share':
                      _shareRecipe(context, state);
                      break;
                    case 'report':
                      _reportRecipe(context, state);
                      break;
                  }
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'share',
                    child: Row(
                      children: [
                        Icon(Icons.share),
                        SizedBox(width: 8),
                        Text('공유하기'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'report',
                    child: Row(
                      children: [
                        Icon(Icons.report),
                        SizedBox(width: 8),
                        Text('신고하기'),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
          body: _buildContent(context, state),
        );
      },
    );
  }

  Widget _buildContent(BuildContext context, RecipeDetailState state) {
    if (state is RecipeDetailLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (state is RecipeDetailError) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              state.message,
              style: Theme.of(context).textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('돌아가기'),
            ),
          ],
        ),
      );
    }

    if (state is RecipeDetailLoaded) {
      return Stack(
        children: [
          // 메인 페이지 뷰
          PageView.builder(
            controller: _pageController,
            onPageChanged: (index) {
              context.read<RecipeDetailCubit>().onPageChanged(index);
            },
            itemCount: state.recipes.length + (state.hasReachedEnd ? 0 : 1),
            itemBuilder: (context, index) {
              if (index >= state.recipes.length) {
                // 로딩 페이지 (더 불러올 데이터가 있을 때)
                return const Center(
                  child: CircularProgressIndicator(),
                );
              }

              final recipe = state.recipes[index];
              return RecipeDetailCard(
                recipe: recipe,
                isLoggedIn: state.isLoggedIn,
                onLikeTap: () => context.read<RecipeDetailCubit>().toggleLike(),
                onSaveTap: () => context.read<RecipeDetailCubit>().toggleSave(),
                onShareTap: () => _shareRecipe(context, state),
              );
            },
          ),

          // 페이지 인디케이터 (여러 페이지가 있을 때)
          if (state.recipes.length > 1)
            Positioned(
              bottom: 100,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    '← 스와이프하여 다른 레시피 보기 →',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ),
        ],
      );
    }

    return const SizedBox.shrink();
  }

  void _shareRecipe(BuildContext context, RecipeDetailState state) {
    if (state is! RecipeDetailLoaded) return;

    final recipe = state.currentRecipe;

    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '${recipe.title} 공유하기',
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
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('곧 구현될 예정입니다'),
                    duration: Duration(seconds: 2),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _reportRecipe(BuildContext context, RecipeDetailState state) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('신고 기능은 곧 구현될 예정입니다'),
        duration: Duration(seconds: 2),
      ),
    );
  }
}
