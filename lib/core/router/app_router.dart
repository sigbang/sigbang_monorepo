import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../presentation/login/pages/login_page.dart';
import '../../presentation/home/pages/home_page.dart';
import '../../presentation/settings/pages/settings_page.dart';

class AppRouter {
  static const String login = '/login';
  static const String home = '/home';
  static const String settings = '/settings';

  static final GoRouter _router = GoRouter(
    initialLocation: login,
    routes: [
      GoRoute(
        path: login,
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: home,
        name: 'home',
        builder: (context, state) => const HomePage(),
      ),
      GoRoute(
        path: settings,
        name: 'settings',
        builder: (context, state) => const SettingsPage(),
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
