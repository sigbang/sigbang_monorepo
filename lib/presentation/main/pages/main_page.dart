import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
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
      const RecipeCreatePlaceholder(), // 레시피 추가 화면
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

// 레시피 등록 화면 플레이스홀더
class RecipeCreatePlaceholder extends StatelessWidget {
  const RecipeCreatePlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.add_circle_outline,
              size: 80,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 24),
            Text(
              '새 레시피 만들기',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              '나만의 특별한 레시피를 공유해보세요',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () {
                context.push('/create-recipe');
              },
              icon: const Icon(Icons.add),
              label: const Text('레시피 등록하기'),
              style: ElevatedButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
