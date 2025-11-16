import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../presentation/session/session_cubit.dart';
import '../../../core/utils/action_guard.dart';

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
              // 로그인 화면으로 이동
              context.push('/login');
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
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home),
              label: '홈',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.restaurant_menu),
              label: '피드',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.search),
              label: '검색',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.add_circle_outline),
              label: '레시피 추가',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person),
              label: '프로필',
            ),
          ],
        ),
      ),
    );
  }
}
