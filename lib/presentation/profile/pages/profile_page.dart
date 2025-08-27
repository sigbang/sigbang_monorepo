import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../injection/injection.dart';
import '../../login/cubits/login_cubit.dart';
import '../../login/cubits/login_state.dart';
import '../../../domain/entities/user.dart';
import '../../../domain/usecases/get_current_user.dart';
import '../cubits/profile_recipes_cubit.dart';
import '../cubits/profile_recipes_state.dart';
import '../../home/widgets/recipe_card.dart';

class ProfilePage extends StatelessWidget {
  final User? user;

  const ProfilePage({super.key, this.user});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => getIt<LoginCubit>(),
      child: _ProfileView(user: user),
    );
  }
}

class _ProfileView extends StatelessWidget {
  final User? user;

  const _ProfileView({required this.user});

  Future<User?> _loadUserIfNeeded() async {
    if (user != null) return user;
    final result = await getIt<GetCurrentUser>()();
    return result.fold((_) => null, (u) => u);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('프로필'),
        actions: [
          IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => context.push('/settings'),
            tooltip: '설정',
          ),
        ],
      ),
      body: BlocListener<LoginCubit, LoginState>(
        listener: (context, state) {
          if (state is LoginInitial) {
            context.go('/login');
          } else if (state is LoginFailure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Theme.of(context).colorScheme.error,
              ),
            );
          }
        },
        child: FutureBuilder<User?>(
          future: _loadUserIfNeeded(),
          builder: (context, snapshot) {
            final displayUser = snapshot.data ?? user;
            return DefaultTabController(
              length: 2,
              child: BlocProvider(
                create: (context) =>
                    getIt<ProfileRecipesCubit>()..loadInitial(),
                child: Column(
                  children: [
                    const SizedBox(height: 16),
                    CircleAvatar(
                      radius: 40,
                      backgroundImage: displayUser?.avatarUrl != null
                          ? NetworkImage(displayUser!.avatarUrl!)
                          : null,
                      child: displayUser?.avatarUrl == null
                          ? Text(
                              (displayUser?.name.isNotEmpty == true)
                                  ? displayUser!.name[0].toUpperCase()
                                  : '?',
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      displayUser?.name ?? '내 프로필',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Divider(height: 1),
                    TabBar(
                      labelColor: Theme.of(context).colorScheme.primary,
                      unselectedLabelColor:
                          Theme.of(context).colorScheme.onSurfaceVariant,
                      labelStyle: const TextStyle(fontWeight: FontWeight.w700),
                      unselectedLabelStyle:
                          const TextStyle(fontWeight: FontWeight.w500),
                      indicatorSize: TabBarIndicatorSize.label,
                      indicator: UnderlineTabIndicator(
                        borderSide: BorderSide(
                          width: 3,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        insets: const EdgeInsets.symmetric(horizontal: 24),
                      ),
                      tabs: const [
                        Tab(text: '레시피'),
                        Tab(text: '북마크'),
                      ],
                    ),
                    const Divider(height: 1),
                    Expanded(
                      child: TabBarView(
                        children: [
                          _RecipesGrid(isSavedTab: false),
                          _RecipesGrid(isSavedTab: true),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _RecipesGrid extends StatelessWidget {
  final bool isSavedTab;
  const _RecipesGrid({required this.isSavedTab});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ProfileRecipesCubit, ProfileRecipesState>(
      builder: (context, state) {
        final recipes = isSavedTab ? state.savedRecipes : state.myRecipes;
        final nextCursor =
            isSavedTab ? state.savedNextCursor : state.myNextCursor;

        if (state.isLoading && recipes.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        if (recipes.isEmpty) {
          return const Center(child: Text('아직 레시피가 없어요'));
        }

        final textScale = MediaQuery.of(context).textScaleFactor;
        final double aspectRatio =
            (0.68 - (textScale - 1.0) * 0.12).clamp(0.56, 0.8);

        return NotificationListener<ScrollNotification>(
          onNotification: (notification) {
            if (notification.metrics.pixels >=
                    notification.metrics.maxScrollExtent * 0.9 &&
                nextCursor != null) {
              if (isSavedTab) {
                context.read<ProfileRecipesCubit>().loadMoreSavedRecipes();
              } else {
                context.read<ProfileRecipesCubit>().loadMoreMyRecipes();
              }
            }
            return false;
          },
          child: GridView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              childAspectRatio: aspectRatio,
            ),
            itemCount: recipes.length,
            itemBuilder: (context, index) {
              final recipe = recipes[index];
              return RecipeCard(
                recipe: recipe,
                onTap: () => context.push('/recipe/${recipe.id}'),
              );
            },
          ),
        );
      },
    );
  }
}
