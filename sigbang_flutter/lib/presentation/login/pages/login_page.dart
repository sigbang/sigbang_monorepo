import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../../core/router/app_router.dart';
import '../../../injection/injection.dart';
import '../cubits/login_cubit.dart';
import '../cubits/login_state.dart';
import '../../home/cubits/home_cubit.dart';
import '../../session/session_cubit.dart';
import '../../../core/constants/app_strings.dart';

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
  @override
  void initState() {
    super.initState();
    debugPrint('LoginView opened');
  }

  void _onLoginPressed(BuildContext context) {
    debugPrint('Login button tapped: Google');
    context.read<LoginCubit>().loginWithGoogle();
  }

  Future<void> _openLink(String url) async {
    final uri = Uri.parse(url);
    await launchUrl(uri, mode: LaunchMode.inAppBrowserView);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
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
            Center(
              child: SingleChildScrollView(
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // // 상단 잠금 아이콘 (웹 룩앤필과 유사)
                      // Container(
                      //   width: 56,
                      //   height: 56,
                      //   decoration: BoxDecoration(
                      //     color: const Color(0xFFFFD54F),
                      //     borderRadius: BorderRadius.circular(14),
                      //   ),
                      //   child: const Icon(Icons.lock,
                      //       size: 28, color: Colors.black87),
                      // ),
                      //logo이미지 + 로그인 텍스트
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SvgPicture.asset(
                            'assets/images/logo_appbar.svg',
                            height: 42,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '로그인',
                            style: theme.textTheme.titleLarge
                                ?.copyWith(fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      //hero image
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: AspectRatio(
                          aspectRatio: 16 / 9,
                          child: Image.asset(
                            'assets/images/hero_login.jpg',
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // 헤드라인/설명
                      Text(
                        '나만의 레시피를 발견하세요.',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.headlineSmall
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '세상의 모든 레시피 식방',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.textTheme.bodyMedium?.color
                              ?.withOpacity(0.7),
                        ),
                      ),
                      const SizedBox(height: 32),

                      // 버튼 카드
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          children: [
                            // Google로 계속하기
                            SizedBox(
                              width: double.infinity,
                              height: 56,
                              child: OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  side: BorderSide(
                                      color: theme.colorScheme.outline),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 16, vertical: 14),
                                  backgroundColor: Colors.white,
                                ),
                                onPressed: () => _onLoginPressed(context),
                                child: Stack(
                                  alignment: Alignment.center,
                                  children: [
                                    Align(
                                      alignment: Alignment.centerLeft,
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          SvgPicture.asset(
                                            'assets/images/logo_google.svg',
                                            width: 20,
                                            height: 20,
                                          ),
                                          const SizedBox(width: 8),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      'Google로 계속하기',
                                      style: theme.textTheme.titleMedium
                                          ?.copyWith(height: 1.2),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),

                            // 메일로 계속하기 (준비중)
                            SizedBox(
                              width: double.infinity,
                              height: 56,
                              child: OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  side: BorderSide(
                                      color: theme.colorScheme.outline),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 16, vertical: 14),
                                  backgroundColor: Colors.white,
                                ),
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('준비중 입니다.'),
                                      behavior: SnackBarBehavior.floating,
                                    ),
                                  );
                                },
                                child: Stack(
                                  alignment: Alignment.center,
                                  children: [
                                    Align(
                                      alignment: Alignment.centerLeft,
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: const [
                                          Icon(Icons.mail_outlined, size: 20),
                                          SizedBox(width: 8),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      '    메일로 계속하기 (준비중)',
                                      style: theme.textTheme.titleMedium
                                          ?.copyWith(height: 1.2),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      // 하단 약관/개인정보 링크
                      Wrap(
                        alignment: WrapAlignment.center,
                        spacing: 8,
                        children: [
                          TextButton(
                            onPressed: () => _openLink(AppStrings.termsUrl),
                            child: const Text('서비스 약관'),
                          ),
                          TextButton(
                            onPressed: () =>
                                _openLink(AppStrings.privacyPolicyUrl),
                            child: const Text('개인정보처리 방침'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ),
            // Close button (top-right) - on top of content
            Positioned(
              right: 0,
              top: 0,
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: IconButton(
                    tooltip: '닫기',
                    icon: const Icon(Icons.close),
                    onPressed: () {
                      context.go(AppRouter.main);
                    },
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
