import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import '../core/router/app_router.dart';
import '../core/theme/app_theme.dart';
import '../core/constants/app_strings.dart';
import '../generated/app_localizations.dart';
import '../injection/injection.dart';
import '../presentation/home/cubits/home_cubit.dart';
import '../presentation/session/session_cubit.dart';

/// The main application widget.
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<HomeCubit>.value(
          value: getIt<HomeCubit>()..loadHome(),
        ),
        BlocProvider<SessionCubit>.value(
          value: getIt<SessionCubit>(),
        ),
      ],
      child: BlocListener<SessionCubit, SessionState>(
        listener: (context, state) {
          if (!state.isLoggedIn) {
            // 세션 종료/401 후 로그인 화면으로 이동
            // ignore: use_build_context_synchronously
            AppRouter.router.go(AppRouter.login);
          }
        },
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
      ),
    );
  }
}
