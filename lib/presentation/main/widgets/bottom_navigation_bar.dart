import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

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
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      currentIndex: currentIndex,
      onTap: (index) {
        // 로그인이 필요한 탭들 (레시피 추가, 프로필)
        if (!isLoggedIn && (index == 2 || index == 3)) {
          // 로그인 화면으로 이동
          context.push('/login');
          return;
        }

        // 레시피 추가 탭의 경우 직접 레시피 등록 화면으로 이동
        if (index == 2 && isLoggedIn) {
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
          icon: Icon(Icons.add_circle_outline),
          label: '레시피 추가',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person),
          label: '프로필',
        ),
      ],
    );
  }
}
