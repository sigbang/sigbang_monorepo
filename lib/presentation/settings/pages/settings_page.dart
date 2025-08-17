import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/router/app_router.dart';
import '../../../injection/injection.dart';
import '../../common/widgets/app_logo.dart';
import '../../login/cubits/login_cubit.dart';
import '../../login/cubits/login_state.dart';

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
        child: ListView(
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
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('개인정보처리방침 페이지 준비 중입니다')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.description),
              title: const Text('서비스 이용약관'),
              trailing: const Icon(Icons.arrow_forward_ios),
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('서비스 이용약관 페이지 준비 중입니다')),
                );
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
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.logout),
                    label: Text(
                      isLoading ? '로그아웃 중...' : AppStrings.logout,
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.error,
                      foregroundColor: Theme.of(context).colorScheme.onError,
                      minimumSize: const Size(double.infinity, 48),
                    ),
                  );
                },
              ),
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
}
