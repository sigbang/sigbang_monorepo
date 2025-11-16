import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/router/app_router.dart';
import '../../../injection/injection.dart';
import '../../common/widgets/app_logo.dart';
import '../../login/cubits/login_cubit.dart';
import '../../login/cubits/login_state.dart';
import '../../../data/datasources/auth_service_new.dart';
import 'package:url_launcher/url_launcher.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => getIt<LoginCubit>(),
      child: const SettingsView(),
    );
  }
}

class SettingsView extends StatelessWidget {
  const SettingsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const AppLogo(),
      ),
      body: BlocListener<LoginCubit, LoginState>(
        listener: (context, state) {
          if (state is LoginInitial) {
            context.go(AppRouter.login);
          } else if (state is LoginFailure) {
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
            ListView(
              children: [
                const SizedBox(height: 16),

                // 계정 섹션
                _buildSectionHeader(context, '계정'),
                ListTile(
                  leading: const Icon(Icons.person),
                  title: const Text('프로필 관리'),
                  subtitle: const Text('프로필 정보를 수정할 수 있습니다'),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('프로필 관리 기능 준비 중입니다')),
                    );
                  },
                ),

                const Divider(),

                // 앱 섹션
                _buildSectionHeader(context, '앱 설정'),
                ListTile(
                  leading: const Icon(Icons.notifications),
                  title: const Text('알림 설정'),
                  subtitle: const Text('푸시 알림을 관리할 수 있습니다'),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('알림 설정 기능 준비 중입니다')),
                    );
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.dark_mode),
                  title: const Text('다크 모드'),
                  subtitle: const Text('앱의 테마를 변경할 수 있습니다'),
                  trailing: Switch(
                    value: Theme.of(context).brightness == Brightness.dark,
                    onChanged: (value) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('다크 모드 기능 준비 중입니다')),
                      );
                    },
                  ),
                ),

                const Divider(),

                // 정보 섹션
                _buildSectionHeader(context, '정보'),
                ListTile(
                  leading: const Icon(Icons.info),
                  title: const Text('앱 정보'),
                  subtitle: const Text('버전 1.0.0'),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: () {
                    showAboutDialog(
                      context: context,
                      applicationName: AppStrings.appName,
                      applicationVersion: '1.0.0',
                      applicationIcon: const Icon(Icons.restaurant_menu),
                      children: [
                        const Text('요리 레시피를 공유하고 발견할 수 있는 앱입니다.'),
                      ],
                    );
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.privacy_tip),
                  title: const Text('개인정보처리방침'),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: () => _openLink(context, AppStrings.privacyPolicyUrl),
                ),
                ListTile(
                  leading: const Icon(Icons.description),
                  title: const Text('서비스 이용약관'),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: () => _openLink(context, AppStrings.termsUrl),
                ),

                // 회원 탈퇴 (정보 섹션 내 노출)
                ListTile(
                  leading: const Icon(Icons.delete_forever, color: Colors.red),
                  title:
                      const Text('회원 탈퇴', style: TextStyle(color: Colors.red)),
                  trailing:
                      const Icon(Icons.arrow_forward_ios, color: Colors.red),
                  onTap: () {
                    context.push('/settings/delete-account');
                  },
                ),

                const Divider(),

                // 로그아웃 버튼
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: BlocBuilder<LoginCubit, LoginState>(
                    builder: (context, state) {
                      final isLoading = state is LoginLoading;

                      return ElevatedButton.icon(
                        onPressed:
                            isLoading ? null : () => _showLogoutDialog(context),
                        icon: isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.logout),
                        label: Text(
                          isLoading ? '로그아웃 중...' : AppStrings.logout,
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Theme.of(context).colorScheme.error,
                          foregroundColor:
                              Theme.of(context).colorScheme.onError,
                          minimumSize: const Size(double.infinity, 48),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
            BlocBuilder<LoginCubit, LoginState>(
              builder: (context, state) {
                if (state is LoginLoading) {
                  return const _FullScreenLoader(message: '로그아웃 중...');
                }
                return const SizedBox.shrink();
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Theme.of(context).colorScheme.primary,
              fontWeight: FontWeight.bold,
            ),
      ),
    );
  }

  Future<void> _openLink(BuildContext context, String url) async {
    try {
      final uri = Uri.parse(url);
      final ok = await launchUrl(
        uri,
        mode: LaunchMode.inAppBrowserView, // iOS/Android는 인앱 브라우저, 나머지는 적절히 처리
      );
      if (!ok && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('링크를 열 수 없습니다')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('링크 열기 실패: $e')),
        );
      }
    }
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('로그아웃'),
        content: const Text('정말 로그아웃하시겠습니까?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('취소'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              context.read<LoginCubit>().logout();
            },
            child: const Text('로그아웃'),
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context) {
    bool agreed = false;
    showDialog(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('회원 탈퇴'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('탈퇴 시 모든 데이터가 영구 삭제되며 복구할 수 없습니다.'),
              const SizedBox(height: 8),
              Row(
                children: [
                  Checkbox(
                    value: agreed,
                    onChanged: (v) => setState(() => agreed = v ?? false),
                  ),
                  const Expanded(
                    child: Text('안내를 확인했으며 탈퇴에 동의합니다'),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('취소'),
            ),
            TextButton(
              onPressed: !agreed
                  ? null
                  : () async {
                      Navigator.of(dialogContext).pop();
                      await _deleteAccount(context);
                    },
              child: const Text(
                '탈퇴하기',
                style: TextStyle(color: Colors.red),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deleteAccount(BuildContext context) async {
    try {
      final auth = getIt<AuthService>();
      await auth.deleteMe();
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('탈퇴가 완료되었습니다')),
        );
        context.go(AppRouter.login);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('탈퇴에 실패했습니다: $e')),
      );
    }
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
