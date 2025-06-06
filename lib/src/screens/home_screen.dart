import 'package:flutter/material.dart';
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
      appBar: AppBar(
        title:
            const Text('레시피 홈', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // 검색 바
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: '레시피, 재료, 국가명으로 검색...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                      filled: true,
                      fillColor: Colors.grey[100],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                DropdownButton<String>(
                  value: _selectedCountry,
                  items: _countries.map((String country) {
                    return DropdownMenuItem<String>(
                      value: country,
                      child: Text(country),
                    );
                  }).toList(),
                  onChanged: (String? newValue) {
                    setState(() {
                      _selectedCountry = newValue!;
                    });
                  },
                ),
              ],
            ),
          ),

          // 테마 카테고리
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            height: 50,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _themes.length,
              itemBuilder: (context, index) {
                return Container(
                  margin: const EdgeInsets.only(right: 8),
                  child: Chip(
                    label: Text(_themes[index]),
                    backgroundColor: Colors.orange[100],
                    labelStyle: TextStyle(color: Colors.orange[800]),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 16),

          // 추천 레시피 섹션
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '오늘의 추천 레시피',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),

                  // 레시피 그리드
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.75,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                    ),
                    itemCount: 6, // 샘플 데이터
                    itemBuilder: (context, index) {
                      return RecipeCard(
                        recipe: _getSampleRecipe(index),
                        onTap: () {
                          // 레시피 상세 페이지로 이동
                        },
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
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
