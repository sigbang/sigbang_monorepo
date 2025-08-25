import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
  bool _isFirstPage = true;
  bool _viewCountIncremented = false;

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
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
          if (state.currentIndex == 0 && !_viewCountIncremented) {
            _viewCountIncremented = true;
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
            systemOverlayStyle: SystemUiOverlayStyle.dark,
            leading: _isFirstPage
                ? IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => Navigator.of(context).pop(),
                  )
                : null,
            automaticallyImplyLeading: _isFirstPage,
            title: null,
            centerTitle: false,
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
      final recipe = state.currentRecipe;
      return RecipeDetailCard(
        recipe: recipe,
        isLoggedIn: state.isLoggedIn,
        onLikeTap: () => context.read<RecipeDetailCubit>().toggleLike(),
        onSaveTap: () => context.read<RecipeDetailCubit>().toggleSave(),
        onShareTap: () => _shareRecipe(context, state),
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
