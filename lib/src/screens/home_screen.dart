import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../widgets/recipe_card.dart';
import '../models/recipe.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedCountry = '전체';

  final List<String> _countries = [
    '전체',
    '한국',
    '일본',
    '중국',
    '이탈리아',
    '프랑스',
    '멕시코',
    '태국',
    '인도'
  ];

  final List<String> _themes = [
    '비 오는 날 음식',
    '다이어트 요리',
    '간편 요리',
    '파티 음식',
    '디저트',
    '든든한 한 끼'
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 상단 메시지 영역
                const Text(
                  'Get amazing recipes for cooking',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 24),

                // 검색바
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.black87, width: 2),
                  ),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search',
                      hintStyle: const TextStyle(color: Colors.grey),
                      prefixIcon: const Icon(Icons.search, color: Colors.grey),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 16,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // 추천 요리 영역 헤더
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Trending now',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    TextButton(
                      onPressed: () {},
                      child: const Text(
                        'See all',
                        style: TextStyle(
                          color: kYellowColor,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // 추천 요리 카드 리스트 (가로 스크롤)
                SizedBox(
                  height: 260,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: trendingRecipes.length,
                    itemBuilder: (context, index) {
                      final recipe = trendingRecipes[index];
                      return Container(
                        width: 280,
                        margin: const EdgeInsets.only(right: 16),
                        child: RecipeCard(recipe: recipe),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 32),

                // 인기 카테고리 헤더
                const Text(
                  'Popular category',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 16),

                // 카테고리 버튼들
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: categories.map((category) {
                    return CategoryChip(
                      label: category['name']!,
                      isSelected: category['isSelected'] as bool,
                      onTap: () {},
                    );
                  }).toList(),
                ),
                const SizedBox(height: 32),

                // 선택된 카테고리의 레시피들
                const Text(
                  'Breakfast recipes',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 16),

                // 카테고리별 레시피 그리드
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 0.8,
                  ),
                  itemCount: breakfastRecipes.length,
                  itemBuilder: (context, index) {
                    final recipe = breakfastRecipes[index];
                    return RecipeGridCard(recipe: recipe);
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Recipe _getSampleRecipe(int index) {
    return Recipe(
      id: 'recipe_$index',
      userId: 'user_$index',
      mainImageUrl: 'https://via.placeholder.com/300x200',
      title: '샘플 레시피 ${index + 1}',
      country: _countries[index % (_countries.length - 1) + 1],
      description: '맛있는 레시피입니다.',
      cookTimeMinutes: 30 + (index * 10),
      difficulty: ['쉬움', '보통', '어려움'][index % 3],
      ingredients: ['재료 1', '재료 2', '재료 3'],
      steps: [
        RecipeStep(stepNumber: 1, description: '첫 번째 단계'),
        RecipeStep(stepNumber: 2, description: '두 번째 단계'),
      ],
      createdAt: DateTime.now().subtract(Duration(days: index)),
      authorName: '요리사 ${index + 1}',
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}

class RecipeCard extends StatelessWidget {
  final Map<String, dynamic> recipe;

  const RecipeCard({super.key, required this.recipe});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          // 배경 이미지
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: Colors.grey[300],
            ),
            child: const Center(
              child: Icon(
                Icons.restaurant_menu,
                size: 80,
                color: Colors.grey,
              ),
            ),
          ),

          // 재생 버튼
          const Positioned(
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            child: Center(
              child: Icon(
                Icons.play_circle_fill,
                size: 50,
                color: Colors.white,
              ),
            ),
          ),

          // 평점 및 북마크
          Positioned(
            top: 12,
            left: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.star, color: Colors.yellow, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    recipe['rating'].toString(),
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                  ),
                ],
              ),
            ),
          ),

          Positioned(
            top: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(Icons.bookmark_border, size: 20),
            ),
          ),

          // 시간 표시
          Positioned(
            bottom: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                recipe['duration'],
                style: const TextStyle(color: Colors.white, fontSize: 12),
              ),
            ),
          ),

          // 제목 및 작성자
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                ),
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Colors.black.withOpacity(0.8),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    recipe['title'],
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const CircleAvatar(
                        radius: 12,
                        backgroundColor: Colors.grey,
                        child:
                            Icon(Icons.person, size: 16, color: Colors.white),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'By ${recipe['author']}',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class CategoryChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const CategoryChip({
    super.key,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? kYellowColor : Colors.grey[200],
          borderRadius: BorderRadius.circular(25),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? kBlackColor : Colors.grey[600],
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}

class RecipeGridCard extends StatelessWidget {
  final Map<String, dynamic> recipe;

  const RecipeGridCard({super.key, required this.recipe});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: Colors.grey[300],
            ),
            child: const Center(
              child: Icon(
                Icons.restaurant_menu,
                size: 50,
                color: Colors.grey,
              ),
            ),
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                ),
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Colors.black.withOpacity(0.8),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Text(
                recipe['title'],
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// 더미 데이터
final List<Map<String, dynamic>> trendingRecipes = [
  {
    'title': 'How to make sharwama at home',
    'author': 'Zeelicious foods',
    'rating': 4.5,
    'duration': '2:00',
  },
  {
    'title': 'Delicious Pasta Recipe',
    'author': 'Chef Mario',
    'rating': 4.2,
    'duration': '1:30',
  },
  {
    'title': 'Homemade Pizza',
    'author': 'Italian Kitchen',
    'rating': 4.8,
    'duration': '3:00',
  },
];

final List<Map<String, dynamic>> categories = [
  {'name': 'breakfast', 'isSelected': true},
  {'name': 'salad', 'isSelected': false},
  {'name': 'Appetizer', 'isSelected': false},
  {'name': 'Noodle', 'isSelected': false},
  {'name': 'Lunch', 'isSelected': false},
  {'name': 'Dinner', 'isSelected': false},
];

final List<Map<String, dynamic>> breakfastRecipes = [
  {'title': 'Pancakes with Syrup'},
  {'title': 'Scrambled Eggs'},
  {'title': 'French Toast'},
  {'title': 'Avocado Toast'},
];
