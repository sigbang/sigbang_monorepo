import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../presentation/login/pages/login_page.dart';
import '../../presentation/main/pages/main_page.dart';
import '../../presentation/settings/pages/settings_page.dart';
import '../../presentation/recipe_detail/pages/recipe_detail_page.dart';
import '../../presentation/home/cubits/home_cubit.dart';
import '../../presentation/home/cubits/home_state.dart';
import '../../injection/injection.dart';

class AppRouter {
  static const String login = '/login';
  static const String main = '/';
  static const String settings = '/settings';
  static const String recipeDetail = '/recipe';

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
        builder: (context, state) => BlocProvider(
          create: (context) => getIt<HomeCubit>()..loadHome(),
          child: BlocBuilder<HomeCubit, HomeState>(
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
                return MainPage(
                  user: null,
                  isLoggedIn: false,
                );
              }
              // 로딩 중에도 기본 화면 표시
              return const MainPage(
                user: null,
                isLoggedIn: false,
              );
            },
          ),
        ),
      ),
      GoRoute(
        path: settings,
        name: 'settings',
        builder: (context, state) => const SettingsPage(),
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
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Page not found: ${state.uri}'),
      ),
    ),
  );

  static GoRouter get router => _router;
}
