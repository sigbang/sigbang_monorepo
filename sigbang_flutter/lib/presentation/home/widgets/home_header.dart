import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../domain/entities/user.dart';
import '../../common/widgets/app_logo.dart';
import 'cooking_tip_carousel.dart';
import '../../../core/config/env_config.dart';
import '../../session/session_cubit.dart';

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
    final sessionUser = context.watch<SessionCubit>().state.user;
    final effectiveUser = sessionUser ?? user;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const SizedBox(width: 4),
            // 앱 로고 영역
            const AppLogo(height: 32),
            const SizedBox(width: 8),
            Text(
              '식방',
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
                  backgroundImage: effectiveUser?.avatarUrl != null
                      ? NetworkImage(_resolveAvatarUrl(_withCacheBust(effectiveUser!.avatarUrl!)))
                      : null,
                  child: effectiveUser?.avatarUrl == null
                      ? Text(
                          effectiveUser?.name.isNotEmpty == true
                              ? effectiveUser!.name[0].toUpperCase()
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
            const SizedBox(width: 8),
          ],
        ),
        const SizedBox(height: 16),
        // 요리 팁 캐러셀
        const SizedBox(height: 8),
        CookingTipCarousel(
          initialTips: const [
            '🧄 마늘은 전자레인지 10초 돌리면 껍질이 쏙 벗겨져요!',
            '🍅 토마토는 꼭지에 十자 칼집 후 뜨거운 물 10초 → 찬물에 담그면 껍질이 쉽게 벗겨져요.',
            '🧊 남은 허브는 물과 함께 얼음 틀에 얼리면 오래 보관할 수 있어요.',
            '🥒 오이는 소금 살짝 문질러 씻으면 껍질이 더 아삭해져요.',
            '🍋 레몬은 30초 전자레인지 후 짜면 즙이 더 잘 나와요.',
          ],
        ),
      ],
    );
  }
}

String _resolveAvatarUrl(String url) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  final clean = url.startsWith('/') ? url.substring(1) : url;
  return '${EnvConfig.baseUrl}/$clean';
}

String _withCacheBust(String url) {
  if (url.isEmpty) return url;
  final ts = DateTime.now().millisecondsSinceEpoch;
  if (url.contains('?')) {
    final uri = Uri.parse(url);
    final qp = Map<String, String>.from(uri.queryParameters);
    qp['v'] = ts.toString();
    return uri.replace(queryParameters: qp).toString();
  }
  return '$url?v=$ts';
}
