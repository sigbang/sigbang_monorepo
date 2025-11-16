import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../injection/injection.dart';
import '../../../data/datasources/auth_service_new.dart';
import '../../../core/router/app_router.dart';

class DeleteAccountPage extends StatefulWidget {
  const DeleteAccountPage({super.key});

  @override
  State<DeleteAccountPage> createState() => _DeleteAccountPageState();
}

class _DeleteAccountPageState extends State<DeleteAccountPage> {
  bool _agreed = false;
  bool _loading = false;

  Future<void> _onDelete() async {
    if (_loading) return;
    setState(() => _loading = true);
    try {
      await getIt<AuthService>().deleteMe();
      if (!mounted) return;
      context.go('${AppRouter.settings}/delete-account/success');
    } catch (_) {
      if (!mounted) return;
      context.go('${AppRouter.settings}/delete-account/error');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('회원 탈퇴'),
      ),
      body: Stack(
        children: [
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _InfoTile(
                icon: Icons.delete_forever,
                text: '계정 정보와 활동 데이터는 즉시 삭제됩니다.',
              ),
              _InfoTile(
                icon: Icons.wallet_giftcard,
                text: '보유 포인트는 소멸되며 복구할 수 없습니다.',
              ),
              _InfoTile(
                icon: Icons.visibility_off,
                text: '작성한 레시피와 댓글은 노출되지 않습니다.',
              ),
              _InfoTile(
                icon: Icons.block,
                text: '탈퇴 후 동일 계정으로 30일간 재가입할 수 없습니다.',
              ),
              const SizedBox(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Checkbox(
                    value: _agreed,
                    onChanged: (v) => setState(() => _agreed = v ?? false),
                  ),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text('위 내용을 모두 확인하였으며 탈퇴에 동의합니다.'),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: _agreed && !_loading ? _onDelete : null,
                  style: FilledButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.error,
                    foregroundColor: Theme.of(context).colorScheme.onError,
                  ),
                  child: Text(_loading ? '탈퇴 처리 중...' : '동의 및 탈퇴하기'),
                ),
              ),
            ],
          ),
          if (_loading)
            const Positioned.fill(
              child: IgnorePointer(
                ignoring: true,
                child: ColoredBox(
                  color: Color(0x33000000),
                  child: Center(child: CircularProgressIndicator()),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoTile({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context)
            .colorScheme
            .surfaceContainerHighest
            .withOpacity(0.35),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style:
                  Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.5),
            ),
          ),
        ],
      ),
    );
  }
}

class DeleteAccountResultPage extends StatelessWidget {
  final bool success;
  const DeleteAccountResultPage.success({super.key}) : success = true;
  const DeleteAccountResultPage.error({super.key}) : success = false;

  @override
  Widget build(BuildContext context) {
    final title = success ? '회원탈퇴가 완료되었습니다.' : '탈퇴 처리 중 문제가 발생했습니다.';
    final subtitle = success ? '이용해 주셔서 감사합니다.' : '다시 시도해 주세요.';
    final icon = success ? Icons.check_circle : Icons.error_outline;
    final color = success ? Colors.green : Theme.of(context).colorScheme.error;

    return Scaffold(
      appBar: AppBar(
        title: const Text('회원 탈퇴'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 72, color: color),
              const SizedBox(height: 16),
              Text(
                title,
                style: Theme.of(context).textTheme.titleLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () {
                  // 완료 후 시작 화면(로그인)로 이동
                  context.go(AppRouter.login);
                },
                child: const Text('확인'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
