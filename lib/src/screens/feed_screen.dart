import 'package:flutter/material.dart';
import '../widgets/recipe_card.dart';
import '../models/recipe.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final List<Recipe> _recipes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadFeedData();
  }

  Future<void> _loadFeedData() async {
    // 샘플 데이터 로딩 시뮬레이션
    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      _recipes.addAll(_generateSampleRecipes());
      _isLoading = false;
    });
  }

  List<Recipe> _generateSampleRecipes() {
    final countries = ['한국', '일본', '중국', '이탈리아', '프랑스', '멕시코', '태국', '인도'];
    final difficulties = ['쉬움', '보통', '어려움'];
    final titles = ['김치찌개', '라멘', '마파두부', '파스타', '코코뱅', '타코', '팟타이', '커리'];

    return List.generate(20, (index) {
      return Recipe(
        id: 'feed_recipe_$index',
        userId: 'user_$index',
        mainImageUrl: 'https://via.placeholder.com/300x200',
        title: titles[index % titles.length],
        country: countries[index % countries.length],
        description: '맛있는 ${titles[index % titles.length]} 레시피입니다.',
        cookTimeMinutes: 20 + (index * 5),
        difficulty: difficulties[index % difficulties.length],
        ingredients: ['재료 1', '재료 2', '재료 3'],
        steps: [
          RecipeStep(stepNumber: 1, description: '첫 번째 단계'),
          RecipeStep(stepNumber: 2, description: '두 번째 단계'),
        ],
        createdAt: DateTime.now().subtract(Duration(hours: index)),
        authorName: '요리사 ${index + 1}',
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title:
            const Text('최신 레시피', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() {
                _isLoading = true;
                _recipes.clear();
              });
              _loadFeedData();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async {
                setState(() {
                  _recipes.clear();
                });
                await _loadFeedData();
              },
              child: _recipes.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.restaurant_menu,
                            size: 64,
                            color: Colors.grey,
                          ),
                          SizedBox(height: 16),
                          Text(
                            '아직 업로드된 레시피가 없습니다.',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _recipes.length,
                      itemBuilder: (context, index) {
                        return Container(
                          height: 280,
                          margin: const EdgeInsets.only(bottom: 16),
                          child: RecipeCard(
                            recipe: _recipes[index],
                            onTap: () {
                              // 레시피 상세 페이지로 이동
                              _navigateToRecipeDetail(_recipes[index]);
                            },
                          ),
                        );
                      },
                    ),
            ),
    );
  }

  void _navigateToRecipeDetail(Recipe recipe) {
    // TODO: 레시피 상세 페이지 네비게이션 구현
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${recipe.title} 상세 페이지로 이동'),
        duration: const Duration(seconds: 1),
      ),
    );
  }
}
