import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/router/app_router.dart';
import '../../../injection/injection.dart';
import '../cubits/login_cubit.dart';
import '../cubits/login_state.dart';
import '../../common/widgets/app_logo.dart';
import '../../main/widgets/bottom_navigation_bar.dart';
import '../../home/cubits/home_cubit.dart';
import '../../session/session_cubit.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => getIt<LoginCubit>(),
      child: const LoginView(),
    );
  }
}

class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    debugPrint('LoginView opened');
  }

  void _onLoginPressed(BuildContext context) {
    debugPrint('Login button tapped: Google');
    context.read<LoginCubit>().loginWithGoogle();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const AppLogo(),
      ),
      bottomNavigationBar: CustomBottomNavigationBar(
        currentIndex: _currentIndex,
        isLoggedIn: false,
        onTap: (index) {
          debugPrint('BottomNav tapped on login page. index=$index');
          setState(() => _currentIndex = index);
          // Navigate to main for accessible tabs to keep UX consistent
          if (index == 0 || index == 1) {
            context.go(AppRouter.main);
          }
        },
      ),
      body: BlocListener<LoginCubit, LoginState>(
        listener: (context, state) {
          if (state is LoginSuccess) {
            debugPrint('Login success');
            // 먼저 홈 상태 갱신 후 화면 전환 (깜빡임 줄임)
            // 세션 갱신 (SessionCubit.user 설정)
            getIt<SessionCubit>().setUser(state.user);
            getIt<HomeCubit>().refreshHome().whenComplete(() {
              context.go(AppRouter.main);
            });
          } else if (state is LoginFailure) {
            debugPrint('Login failed: ${state.message}');
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Theme.of(context).colorScheme.error,
              ),
            );
          }
        },
        child: Stack(
          children: [
            SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(minHeight: 560),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: 24),

                      // 앱 로고/제목 (브랜드 룩 적용)
                      const SizedBox(height: 32),
                      Text(
                        '로그인',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 48),

                      // Google 로그인 버튼
                      ElevatedButton.icon(
                        onPressed: () => _onLoginPressed(context),
                        icon: const Icon(Icons.login),
                        label: const Text('Google로 계속하기'),
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(double.infinity, 48),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            BlocBuilder<LoginCubit, LoginState>(
              builder: (context, state) {
                if (state is LoginLoading) {
                  return const _FullScreenLoader(message: '로그인 중...');
                }
                return const SizedBox.shrink();
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _FullScreenLoader extends StatelessWidget {
  final String message;
  const _FullScreenLoader({required this.message});

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: AbsorbPointer(
        absorbing: true,
        child: Container(
          color: Colors.black.withOpacity(0.35),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 12),
                Text(
                  message,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onInverseSurface,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
