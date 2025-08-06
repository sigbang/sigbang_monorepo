import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../domain/entities/user.dart';

class HomeHeader extends StatelessWidget {
  final User? user;
  final bool isLoggedIn;

  const HomeHeader({
    super.key,
    this.user,
    required this.isLoggedIn,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            // 앱 로고 영역
            Text(
              '시그방',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).primaryColor,
                  ),
            ),
            const Spacer(),
            // 프로필 / 로그인 버튼
            if (isLoggedIn) ...[
              GestureDetector(
                onTap: () => context.push('/profile'),
                child: CircleAvatar(
                  radius: 20,
                  backgroundImage: user?.avatarUrl != null
                      ? NetworkImage(user!.avatarUrl!)
                      : null,
                  child: user?.avatarUrl == null
                      ? Text(
                          user?.name.isNotEmpty == true
                              ? user!.name[0].toUpperCase()
                              : '?',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                          ),
                        )
                      : null,
                ),
              ),
            ] else ...[
              TextButton(
                onPressed: () => context.push('/login'),
                child: const Text('로그인'),
              ),
            ],
          ],
        ),
        const SizedBox(height: 16),
        // 인사말
        if (isLoggedIn) ...[
          Text(
            '안녕하세요, ${user?.name ?? '사용자'}님!',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          Text(
            '오늘은 어떤 요리를 해보실까요?',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
          ),
        ] else ...[
          Text(
            '시그방에 오신 것을 환영합니다!',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          Text(
            '다양한 레시피를 둘러보세요',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
          ),
        ],
        const SizedBox(height: 24),
        // 검색 바
        Container(
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(12),
          ),
          child: TextField(
            decoration: const InputDecoration(
              hintText: '레시피, 재료명으로 검색',
              prefixIcon: Icon(Icons.search),
              border: InputBorder.none,
              contentPadding:
                  EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            onSubmitted: (value) {
              if (value.isNotEmpty) {
                context.push('/feed?search=${Uri.encodeComponent(value)}');
              }
            },
          ),
        ),
      ],
    );
  }
}
