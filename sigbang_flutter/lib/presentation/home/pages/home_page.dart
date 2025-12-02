import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../domain/entities/recipe.dart';

import '../cubits/home_cubit.dart';
import '../cubits/home_state.dart';
import '../widgets/recipe_card.dart';
import '../widgets/home_header.dart';
import '../widgets/popular_recipe_square_card.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return const HomeView();
  }
}

class HomeView extends StatelessWidget {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: BlocBuilder<HomeCubit, HomeState>(
          builder: (context, state) {
            if (state is HomeLoading) {
              return const Center(
                child: CircularProgressIndicator(),
              );
            }

            if (state is HomeError) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      size: 64,
                      color: Colors.red,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      state.message,
                      style: Theme.of(context).textTheme.bodyLarge,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => context.read<HomeCubit>().loadHome(),
                      child: const Text('다시 시도'),
                    ),
                  ],
                ),
              );
            }

            if (state is HomeLoaded || state is HomeRefreshing) {
              final user = state is HomeLoaded
                  ? state.user
                  : (state as HomeRefreshing).user;
              final popularRecipes = state is HomeLoaded
                  ? state.popularRecipes
                  : (state as HomeRefreshing).popularRecipes;
              final recommendedRecipes = state is HomeLoaded
                  ? state.recommendedRecipes
                  : (state as HomeRefreshing).recommendedRecipes;
              final isLoggedIn = state is HomeLoaded
                  ? state.isLoggedIn
                  : (state as HomeRefreshing).isLoggedIn;
              final isRefreshing = state is HomeRefreshing;

              return RefreshIndicator(
                onRefresh: () => context.read<HomeCubit>().refreshHome(),
                child: CustomScrollView(
                  slivers: [
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: HomeHeader(
                          user: user,
                          isLoggedIn: isLoggedIn,
                        ),
                      ),
                    ),
                    const SliverToBoxAdapter(child: SizedBox(height: 12)),
                    // 인기 레시피 섹션 제목
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20.0),
                        child: Text(
                          '🔥 인기 레시피',
                          style: Theme.of(context)
                              .textTheme
                              .titleLarge
                              ?.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                    const SliverToBoxAdapter(child: SizedBox(height: 16)),
                    // 인기 레시피 가로 스크롤
                    SliverToBoxAdapter(
                      child: SizedBox(
                        height: 160,
                        child: ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          scrollDirection: Axis.horizontal,
                          itemCount: popularRecipes.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (context, index) {
                            final recipe = popularRecipes[index];
                            return SizedBox(
                              width: 160,
                              child: PopularRecipeSquareCard(
                                recipe: recipe,
                                onTap: () =>
                                    context.push('/recipe/${recipe.id}'),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                    const SliverToBoxAdapter(child: SizedBox(height: 16)),
                    // 베타 테스트 배너
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        child: _buildBetaBanner(context),
                      ),
                    ),
                    const SliverToBoxAdapter(child: SizedBox(height: 16)),
                    // 추천 레시피 섹션 제목
                    const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16.0),
                        child: Divider(),
                      ),
                    ),
                    const SliverToBoxAdapter(child: SizedBox(height: 12)),
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        child: Row(
                          children: [
                            Text(
                              '추천 레시피',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleLarge
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                            const Spacer(),
                            if (isRefreshing)
                              const SizedBox(
                                width: 16,
                                height: 16,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2),
                              ),
                          ],
                        ),
                      ),
                    ),
                    const SliverToBoxAdapter(child: SizedBox(height: 12)),
                    _buildRecipeGrid(context, recommendedRecipes),
                    const SliverToBoxAdapter(child: SizedBox(height: 100)),
                  ],
                ),
              );
            }

            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  static final Uri _betaBannerUri = Uri.parse('https://sigbang.com/feedback');

  Future<void> _onTapBetaBanner() async {
    if (!await launchUrl(_betaBannerUri,
        mode: LaunchMode.externalApplication)) {
      // ignore: avoid_print
      print('Could not launch $_betaBannerUri');
    }
  }

  Widget _buildBetaBanner(BuildContext context) {
    return Material(
      color: Theme.of(context).colorScheme.secondary,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: _onTapBetaBanner,
        child: Container(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              const Icon(Icons.campaign, color: Colors.black87),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  '식방 사용후기 작성하고 커피쿠폰 받기',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: Colors.black87,
                      ),
                ),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.open_in_new, color: Colors.black87),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRecipeGrid(BuildContext context, List<Recipe> recipes) {
    if (recipes.isEmpty) {
      return const SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(32.0),
            child: Column(
              children: [
                Icon(
                  Icons.restaurant_menu,
                  size: 64,
                  color: Colors.grey,
                ),
                SizedBox(height: 16),
                Text(
                  '아직 추천할 레시피가 없어요',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final textScale = MediaQuery.of(context).textScaleFactor;
    final double aspectRatio =
        (0.68 - (textScale - 1.0) * 0.12).clamp(0.56, 0.8);

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      sliver: SliverGrid(
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
          childAspectRatio: aspectRatio,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final recipe = recipes[index];
            return RecipeCard(
              recipe: recipe,
              onTap: () => context.push('/recipe/${recipe.id}'),
            );
          },
          childCount: recipes.length,
        ),
      ),
    );
  }
}
