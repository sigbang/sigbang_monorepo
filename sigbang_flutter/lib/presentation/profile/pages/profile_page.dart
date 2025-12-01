import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../injection/injection.dart';
import '../../login/cubits/login_cubit.dart';
import '../../login/cubits/login_state.dart';
import '../../../domain/entities/user.dart';
import '../cubits/profile_recipes_cubit.dart';
import '../cubits/profile_recipes_state.dart';
import '../../home/widgets/recipe_card.dart';
import '../../../data/datasources/api_client.dart';
import '../../../domain/entities/user.dart' show UserStatus;
import '../../session/session_cubit.dart';
import '../../../core/config/env_config.dart';

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

class _ProfileView extends StatefulWidget {
  final User? user;
  const _ProfileView({required this.user});
  @override
  State<_ProfileView> createState() => _ProfileViewState();
}

class _ProfileViewState extends State<_ProfileView> {
  bool _refreshedOnce = false;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_refreshedOnce) {
      _refreshedOnce = true;
      // 진입 시 서버 최신 사용자 정보 동기화
      context.read<SessionCubit>().refreshFromServer();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: null,
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        systemOverlayStyle: const SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark,
          statusBarBrightness: Brightness.light,
        ),
        iconTheme:
            IconThemeData(color: Theme.of(context).colorScheme.onSurface),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () async {
              await context.push('/profile/edit');
              if (context.mounted) {
                await context.read<SessionCubit>().refreshFromServer();
              }
            },
            tooltip: '프로필 수정',
          ),
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
        child: BlocBuilder<SessionCubit, SessionState>(
          builder: (context, sessionState) {
            final sessionUser = sessionState.user;
            final effectiveUser = sessionUser ?? widget.user;
            final displayUser = sessionUser ?? widget.user;
            return DefaultTabController(
              length: 2,
              child: BlocProvider(
                create: (context) =>
                    getIt<ProfileRecipesCubit>()..loadInitial(),
                child: Column(
                  children: [
                    if (displayUser?.status == UserStatus.suspended)
                      Container(
                        width: double.infinity,
                        color: Colors.amber.withOpacity(0.2),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                        child: Row(
                          children: [
                            Icon(Icons.warning_amber_rounded,
                                color: Theme.of(context).colorScheme.error),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                '계정이 일시 정지되었습니다. 일부 기능을 사용할 수 없습니다.',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 8),
                    CircleAvatar(
                      radius: 40,
                      backgroundImage: effectiveUser?.avatarUrl != null
                          ? NetworkImage(_resolveAvatarUrl(_withCacheBust(effectiveUser!.avatarUrl!)))
                          : null,
                      child: effectiveUser?.avatarUrl == null
                          ? Text(
                              (effectiveUser?.name.isNotEmpty == true)
                                  ? effectiveUser!.name[0].toUpperCase()
                                  : '?',
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      effectiveUser?.name ?? '내 프로필',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    FutureBuilder<_ProfileStats>(
                      future: _fetchStats(displayUser?.id),
                      builder: (context, statsSnap) {
                        final stats = statsSnap.data;
                        return Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 6),
                          child: Center(
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _CountTile(
                                  label: '레시피',
                                  count: stats?.recipesCount ?? 0,
                                ),
                                const SizedBox(width: 72),
                                _CountTile(
                                  label: '팔로잉',
                                  count: stats?.followingCount ?? 0,
                                ),
                                const SizedBox(width: 72),
                                _CountTile(
                                  label: '팔로워',
                                  count: stats?.followerCount ?? 0,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                    const Divider(height: 1),
                    const SizedBox(height: 16),
                    TabBar(
                      labelColor: Theme.of(context).colorScheme.primary,
                      unselectedLabelColor:
                          Theme.of(context).colorScheme.onSurfaceVariant,
                      labelStyle: const TextStyle(
                          fontSize: 18, fontWeight: FontWeight.w500),
                      unselectedLabelStyle: const TextStyle(
                          fontSize: 18, fontWeight: FontWeight.w300),
                      indicatorSize: TabBarIndicatorSize.label,
                      indicator: UnderlineTabIndicator(
                        borderSide: BorderSide(
                          width: 6,
                          color: Theme.of(context).colorScheme.secondary,
                        ),
                        insets: const EdgeInsets.symmetric(horizontal: 100),
                      ),
                      tabs: const [
                        Tab(text: '레시피'),
                        Tab(text: '북마크'),
                      ],
                    ),
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

  Future<_ProfileStats> _fetchStats(String? userId) async {
    try {
      final dio = getIt<ApiClient>().dio;
      final futures = <Future<dynamic>>[
        dio.get('/users/me'),
        if (userId != null) dio.get('/users/$userId/follow-counts'),
      ];
      final responses = await Future.wait(futures);

      final meData = responses[0].data as Map<String, dynamic>;
      final meStats = (meData['stats'] ?? const {}) as Map<String, dynamic>;
      int recipesCount = (meStats['recipesCount'] as num?)?.toInt() ?? 0;

      int followerCount = 0;
      int followingCount = 0;
      if (responses.length > 1) {
        final ff = responses[1].data as Map<String, dynamic>;
        followerCount = (ff['followerCount'] as num?)?.toInt() ?? 0;
        followingCount = (ff['followingCount'] as num?)?.toInt() ?? 0;
      }

      return _ProfileStats(
        recipesCount: recipesCount,
        followerCount: followerCount,
        followingCount: followingCount,
      );
    } catch (_) {
      return const _ProfileStats(
        recipesCount: 0,
        followerCount: 0,
        followingCount: 0,
      );
    }
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

class _CountTile extends StatelessWidget {
  final String label;
  final int count;
  const _CountTile({required this.label, required this.count});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          _formatNumber(count),
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }

  static String _formatNumber(int n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return n.toString();
  }
}

class _ProfileStats {
  final int recipesCount;
  final int followerCount;
  final int followingCount;
  const _ProfileStats({
    required this.recipesCount,
    required this.followerCount,
    required this.followingCount,
  });
}

String _resolveAvatarUrl(String url) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  final clean = url.startsWith('/') ? url.substring(1) : url;
  // Preserve existing query strings (e.g., cache-bust `?v=...`)
  return '${EnvConfig.baseUrl}/$clean';
}

String _withCacheBust(String url) {
  if (url.isEmpty) return url;
  final ts = DateTime.now().millisecondsSinceEpoch;
  if (url.contains('?')) {
    // If it already contains v=, replace it; else append
    final uri = Uri.parse(url);
    final qp = Map<String, String>.from(uri.queryParameters);
    qp['v'] = ts.toString();
    return uri.replace(queryParameters: qp).toString();
  }
  return '$url?v=$ts';
}
