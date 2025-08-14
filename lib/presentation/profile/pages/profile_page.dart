import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_strings.dart';
import '../../../injection/injection.dart';
import '../../login/cubits/login_cubit.dart';
import '../../login/cubits/login_state.dart';
import '../../../domain/entities/user.dart';
import '../../../domain/usecases/get_current_user.dart';

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

class _ProfileView extends StatelessWidget {
  final User? user;

  const _ProfileView({required this.user});

  Future<User?> _loadUserIfNeeded() async {
    if (user != null) return user;
    final result = await getIt<GetCurrentUser>()();
    return result.fold((_) => null, (u) => u);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.profile),
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
        child: FutureBuilder<User?>(
          future: _loadUserIfNeeded(),
          builder: (context, snapshot) {
            final displayUser = snapshot.data ?? user;
            return Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 24),
                  Center(
                    child: CircleAvatar(
                      radius: 40,
                      backgroundImage: displayUser?.avatarUrl != null
                          ? NetworkImage(displayUser!.avatarUrl!)
                          : null,
                      child: displayUser?.avatarUrl == null
                          ? Text(
                              (displayUser?.name.isNotEmpty == true)
                                  ? displayUser!.name[0].toUpperCase()
                                  : '?',
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                              ),
                            )
                          : null,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    displayUser?.name ?? '내 프로필',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (displayUser?.email != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      displayUser!.email,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                  const Spacer(),
                  BlocBuilder<LoginCubit, LoginState>(
                    builder: (context, state) {
                      final isLoading = state is LoginLoading;
                      return ElevatedButton.icon(
                        onPressed:
                            isLoading ? null : () => _confirmLogout(context),
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
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
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
