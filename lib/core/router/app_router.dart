import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../presentation/login/pages/login_page.dart';
import '../../presentation/main/pages/main_page.dart';
import '../../presentation/settings/pages/settings_page.dart';
import '../../presentation/recipe_detail/pages/recipe_detail_page.dart';
import '../../presentation/recipe_create/pages/recipe_create_page.dart';
import '../../presentation/recipe_edit/pages/recipe_edit_page.dart';
import '../../presentation/profile/pages/profile_page.dart';
import '../../presentation/search/pages/search_page.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../presentation/home/cubits/home_cubit.dart';
import '../../presentation/home/cubits/home_state.dart';
import '../../injection/injection.dart';
import '../../presentation/session/session_cubit.dart';
import '../../domain/entities/user.dart' show UserStatus;

class AppRouter {
  static const String login = '/login';
  static const String main = '/';
  static const String settings = '/settings';
  static const String recipeDetail = '/recipe';
  static const String recipeCreate = '/create-recipe';
  static const String recipeEdit = '/edit-recipe';
  static const String profile = '/profile';
  static const String search = '/search';

  static String? _guardSuspendedAccess(
      BuildContext context, GoRouterState state) {
    try {
      final user = getIt<SessionCubit>().state.user;
      if (user?.status == UserStatus.suspended) {
        return main; // Redirect to main page
      }
    } catch (_) {
      // If session cubit not available, allow access
    }
    return null; // Allow access
  }

  static final GoRouter _router = GoRouter(
    initialLocation: main,
    routes: [
      GoRoute(
        path: login,
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: main,
        name: 'main',
        builder: (context, state) => BlocBuilder<HomeCubit, HomeState>(
          builder: (context, homeState) {
            if (homeState is HomeLoaded) {
              return MainPage(
                user: homeState.user,
                isLoggedIn: homeState.isLoggedIn,
              );
            } else if (homeState is HomeRefreshing) {
              return MainPage(
                user: homeState.user,
                isLoggedIn: homeState.isLoggedIn,
              );
            } else if (homeState is HomeError) {
              return const MainPage(user: null, isLoggedIn: false);
            }
            return const MainPage(user: null, isLoggedIn: false);
          },
        ),
      ),
      GoRoute(
        path: settings,
        name: 'settings',
        builder: (context, state) => const SettingsPage(),
      ),
      GoRoute(
        path: profile,
        name: 'profile',
        builder: (context, state) => const ProfilePage(),
      ),
      GoRoute(
        path: search,
        name: 'search',
        builder: (context, state) => const SearchPage(),
      ),
      GoRoute(
        path: '$recipeDetail/:recipeId',
        name: 'recipe_detail',
        builder: (context, state) {
          final recipeId = state.pathParameters['recipeId']!;
          final feedQuery = state.uri.queryParameters['feedQuery'];
          final tagsParam = state.uri.queryParameters['tags'];
          final tags = tagsParam?.split(',') ?? <String>[];

          return RecipeDetailPage(
            recipeId: recipeId,
            feedQuery: feedQuery,
            tags: tags,
          );
        },
      ),
      GoRoute(
        path: recipeCreate,
        name: 'recipe_create',
        redirect: _guardSuspendedAccess,
        builder: (context, state) => const RecipeCreatePage(),
      ),
      GoRoute(
        path: '$recipeEdit/:recipeId',
        name: 'recipe_edit',
        redirect: _guardSuspendedAccess,
        builder: (context, state) {
          final recipeId = state.pathParameters['recipeId']!;
          return RecipeEditPage(recipeId: recipeId);
        },
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Page not found: ${state.uri}'),
      ),
    ),
  );

  static GoRouter get router => _router;
}
