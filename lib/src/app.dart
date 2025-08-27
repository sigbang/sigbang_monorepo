import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import '../core/router/app_router.dart';
import '../core/theme/app_theme.dart';
import '../core/constants/app_strings.dart';
import '../generated/app_localizations.dart';
import '../injection/injection.dart';
import '../presentation/home/cubits/home_cubit.dart';

/// The main application widget.
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<HomeCubit>.value(
      value: getIt<HomeCubit>()..loadHome(),
      child: MaterialApp.router(
        // Provide the generated AppLocalizations to the MaterialApp.
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: const [
          Locale('en', ''), // English, no country code
        ],

        // App title
        title: AppStrings.appName,

        // Theme configuration
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,

        // Router configuration
        routerConfig: AppRouter.router,

        // Debug banner
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
