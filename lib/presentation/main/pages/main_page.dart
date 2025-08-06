import 'package:flutter/material.dart';
import '../../../domain/entities/user.dart';
import '../../home/pages/home_page.dart';
import '../../feed/pages/feed_page.dart';
import '../../profile/pages/profile_page.dart';
import '../widgets/bottom_navigation_bar.dart';

class MainPage extends StatefulWidget {
  final User? user;
  final bool isLoggedIn;

  const MainPage({
    super.key,
    this.user,
    required this.isLoggedIn,
  });

  @override
  State<MainPage> createState() => _MainPageState();
}

class _MainPageState extends State<MainPage> {
  int _currentIndex = 0;

  late final List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    _pages = [
      const HomePage(), // 홈
      const FeedPage(), // 피드
      const Scaffold(
        body: Center(
          child: Text('레시피 추가'), // 레시피 추가 (추후 구현)
        ),
      ),
      widget.isLoggedIn
          ? const ProfilePage() // 프로필 (로그인 시)
          : const Scaffold(
              body: Center(
                child: Text('로그인이 필요합니다'), // 로그인 유도 (비로그인 시)
              ),
            ),
    ];
  }

  void _onTabTapped(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: CustomBottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: _onTabTapped,
        isLoggedIn: widget.isLoggedIn,
      ),
    );
  }
}
