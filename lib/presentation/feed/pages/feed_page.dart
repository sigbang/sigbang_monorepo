import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../injection/injection.dart';
import '../cubits/feed_cubit.dart';
import '../cubits/feed_state.dart';
import '../widgets/feed_search_bar.dart';
import '../widgets/feed_filter_chips.dart';
import '../widgets/recipe_list_item.dart';

class FeedPage extends StatelessWidget {
  const FeedPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => getIt<FeedCubit>()..loadFeed(),
      child: const FeedView(),
    );
  }
}

class FeedView extends StatefulWidget {
  const FeedView({super.key});

  @override
  State<FeedView> createState() => _FeedViewState();
}

class _FeedViewState extends State<FeedView> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_isBottom) {
      context.read<FeedCubit>().loadMoreRecipes();
    }
  }

  bool get _isBottom {
    if (!_scrollController.hasClients) return false;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;
    return currentScroll >= (maxScroll * 0.9);
  }

  void _showFilterModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: BlocProvider.value(
          value: context.read<FeedCubit>(),
          child: Column(
            children: [
              // 드래그 핸들
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: Theme.of(context)
                      .colorScheme
                      .onSurfaceVariant
                      .withOpacity(0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // 타이틀
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Text(
                      '필터',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
              ),
              const Divider(),
              // 필터 내용
              Expanded(
                child: SingleChildScrollView(
                  child: BlocBuilder<FeedCubit, FeedState>(
                    builder: (context, state) {
                      final selectedTags =
                          state is FeedLoaded ? state.selectedTags : <String>[];
                      return FeedFilterChips(
                        selectedTags: selectedTags,
                        onTagsChanged: (tags) =>
                            context.read<FeedCubit>().filterByTags(tags),
                        onClearAll: () =>
                            context.read<FeedCubit>().clearFilters(),
                      );
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: BlocBuilder<FeedCubit, FeedState>(
          builder: (context, state) {
            return Column(
              children: [
                Expanded(
                  child: _buildContent(context, state),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, FeedState state) {
    if (state is FeedLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (state is FeedError) {
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
              onPressed: () => context.read<FeedCubit>().loadFeed(),
              child: const Text('다시 시도'),
            ),
          ],
        ),
      );
    }

    if (state is FeedLoaded) {
      if (state.recipes.isEmpty) {
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.restaurant_menu,
                size: 64,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              const SizedBox(height: 16),
              Text(
                state.searchQuery != null || state.selectedTags.isNotEmpty
                    ? '검색 결과가 없습니다'
                    : '아직 레시피가 없습니다',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                state.searchQuery != null || state.selectedTags.isNotEmpty
                    ? '다른 검색어나 필터를 시도해보세요'
                    : '첫 번째 레시피를 등록해보세요!',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                textAlign: TextAlign.center,
              ),
              if (state.searchQuery != null ||
                  state.selectedTags.isNotEmpty) ...[
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => context.read<FeedCubit>().clearFilters(),
                  child: const Text('필터 초기화'),
                ),
              ],
            ],
          ),
        );
      }

      return RefreshIndicator(
        onRefresh: () => context.read<FeedCubit>().refreshFeed(),
        child: ListView.builder(
          controller: _scrollController,
          itemCount: state.recipes.length + (state.hasReachedMax ? 0 : 1),
          itemBuilder: (context, index) {
            if (index >= state.recipes.length) {
              // 로딩 인디케이터 (더 불러올 데이터가 있을 때)
              return const Padding(
                padding: EdgeInsets.all(16),
                child: Center(
                  child: CircularProgressIndicator(),
                ),
              );
            }

            final recipe = state.recipes[index];
            return RecipeListItem(
              recipe: recipe,
              isLoggedIn: state.isLoggedIn,
              onTap: () {
                // 레시피 상세 화면으로 이동 (피드 컨텍스트 포함)
                String? queryParams;
                if (state.searchQuery != null ||
                    state.selectedTags.isNotEmpty) {
                  final params = <String>[];
                  if (state.searchQuery != null) {
                    params.add(
                        'feedQuery=${Uri.encodeComponent(state.searchQuery!)}');
                  }
                  if (state.selectedTags.isNotEmpty) {
                    params.add('tags=${state.selectedTags.join(',')}');
                  }
                  queryParams = params.join('&');
                }

                final uri = queryParams != null
                    ? '/recipe/${recipe.id}?$queryParams'
                    : '/recipe/${recipe.id}';

                context.push(uri);
              },
            );
          },
        ),
      );
    }

    return const SizedBox.shrink();
  }
}
