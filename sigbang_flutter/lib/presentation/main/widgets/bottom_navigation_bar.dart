import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../../presentation/session/session_cubit.dart';
import '../../../core/utils/action_guard.dart';
import '../../common/login_required_dialog.dart';

class CustomBottomNavigationBar extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;
  final bool isLoggedIn;

  const CustomBottomNavigationBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.isLoggedIn,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        border: Border(
          top: BorderSide(
            color: Theme.of(context).dividerColor.withOpacity(0.7),
            width: 0.6,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: BottomNavigationBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          type: BottomNavigationBarType.fixed,
          currentIndex: currentIndex,
          onTap: (index) {
            // 로그인이 필요한 탭들 (레시피 추가, 프로필)
            if (!isLoggedIn && (index == 3 || index == 4)) {
              // 로그인 안내 다이얼로그 표시
              showLoginRequiredDialog(context);
              return;
            }

            // 레시피 추가 탭의 경우 직접 레시피 등록 화면으로 이동
            if (index == 3 && isLoggedIn) {
              final user = context.read<SessionCubit>().state.user;
              final canCreate =
                  ActionGuard.canPerform(user?.status, ActionType.createRecipe);
              if (!canCreate) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                      content: Text(ActionGuard.getRestrictionMessage(
                          ActionType.createRecipe))),
                );
                return;
              }
              context.push('/create-recipe');
              return;
            }

            onTap(index);
          },
          selectedItemColor: Theme.of(context).primaryColor,
          unselectedItemColor: Colors.grey,
          items: [
            BottomNavigationBarItem(
              icon: SvgPicture.asset(
                'assets/images/nav_home.svg',
                width: 22,
                height: 22,
                colorFilter:
                    const ColorFilter.mode(Colors.grey, BlendMode.srcIn),
              ),
              activeIcon: SvgPicture.asset(
                'assets/images/nav_home.svg',
                width: 22,
                height: 22,
                colorFilter: ColorFilter.mode(
                  Theme.of(context).primaryColor,
                  BlendMode.srcIn,
                ),
              ),
              label: '홈',
            ),
            BottomNavigationBarItem(
              icon: SvgPicture.asset(
                'assets/images/nav_search.svg',
                width: 22,
                height: 22,
                colorFilter:
                    const ColorFilter.mode(Colors.grey, BlendMode.srcIn),
              ),
              activeIcon: SvgPicture.asset(
                'assets/images/nav_search.svg',
                width: 22,
                height: 22,
                colorFilter: ColorFilter.mode(
                  Theme.of(context).primaryColor,
                  BlendMode.srcIn,
                ),
              ),
              label: '검색',
            ),
            BottomNavigationBarItem(
              icon: SvgPicture.asset(
                'assets/images/nav_feed.svg',
                width: 22,
                height: 22,
                colorFilter:
                    const ColorFilter.mode(Colors.grey, BlendMode.srcIn),
              ),
              activeIcon: SvgPicture.asset(
                'assets/images/nav_feed.svg',
                width: 22,
                height: 22,
                colorFilter: ColorFilter.mode(
                  Theme.of(context).primaryColor,
                  BlendMode.srcIn,
                ),
              ),
              label: '탐색',
            ),
            BottomNavigationBarItem(
              icon: SvgPicture.asset(
                'assets/images/nav_create.svg',
                width: 22,
                height: 22,
                colorFilter:
                    const ColorFilter.mode(Colors.grey, BlendMode.srcIn),
              ),
              activeIcon: SvgPicture.asset(
                'assets/images/nav_create.svg',
                width: 22,
                height: 22,
                colorFilter: ColorFilter.mode(
                  Theme.of(context).primaryColor,
                  BlendMode.srcIn,
                ),
              ),
              label: '레시피 추가',
            ),
            BottomNavigationBarItem(
              icon: SvgPicture.asset(
                'assets/images/nav_profile.svg',
                width: 22,
                height: 22,
                colorFilter:
                    const ColorFilter.mode(Colors.grey, BlendMode.srcIn),
              ),
              activeIcon: SvgPicture.asset(
                'assets/images/nav_profile.svg',
                width: 22,
                height: 22,
                colorFilter: ColorFilter.mode(
                  Theme.of(context).primaryColor,
                  BlendMode.srcIn,
                ),
              ),
              label: '프로필',
            ),
          ],
        ),
      ),
    );
  }
}
