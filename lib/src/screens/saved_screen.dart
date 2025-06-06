import 'package:flutter/material.dart';
import '../widgets/recipe_card.dart';
import '../models/recipe.dart';

class SavedScreen extends StatefulWidget {
  const SavedScreen({super.key});

  @override
  State<SavedScreen> createState() => _SavedScreenState();
}

class _SavedScreenState extends State<SavedScreen> {
  final List<Recipe> _savedRecipes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSavedRecipes();
  }

  Future<void> _loadSavedRecipes() async {
    // 샘플 데이터 로딩 시뮬레이션
    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      _savedRecipes.addAll(_generateSampleSavedRecipes());
      _isLoading = false;
    });
  }

  List<Recipe> _generateSampleSavedRecipes() {
    final countries = ['한국', '일본', '이탈리아', '프랑스'];
    final difficulties = ['쉬움', '보통', '어려움'];
    final titles = ['김치찌개', '라멘', '파스타', '코코뱅'];

    return List.generate(4, (index) {
      return Recipe(
        id: 'saved_recipe_$index',
        userId: 'user_$index',
        mainImageUrl: 'https://via.placeholder.com/300x200',
        title: titles[index],
        country: countries[index],
        description: '저장한 ${titles[index]} 레시피입니다.',
        cookTimeMinutes: 30 + (index * 10),
        difficulty: difficulties[index % difficulties.length],
        ingredients: ['재료 1', '재료 2', '재료 3'],
        steps: [
          RecipeStep(stepNumber: 1, description: '첫 번째 단계'),
          RecipeStep(stepNumber: 2, description: '두 번째 단계'),
        ],
        createdAt: DateTime.now().subtract(Duration(days: index + 1)),
        authorName: '요리사 ${index + 1}',
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('저장한 레시피',
            style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() {
                _isLoading = true;
                _savedRecipes.clear();
              });
              _loadSavedRecipes();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _savedRecipes.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.bookmark_border,
                        size: 64,
                        color: Colors.grey,
                      ),
                      SizedBox(height: 16),
                      Text(
                        '저장한 레시피가 없습니다.',
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.grey,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      SizedBox(height: 8),
                      Text(
                        '마음에 드는 레시피를 저장해보세요!',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                )
              : Column(
                  children: [
                    // 상단 정보
                    Container(
                      padding: const EdgeInsets.all(16),
                      color: Colors.orange[50],
                      child: Row(
                        children: [
                          Icon(Icons.bookmark, color: Colors.orange[700]),
                          const SizedBox(width: 8),
                          Text(
                            '총 ${_savedRecipes.length}개의 레시피를 저장했습니다',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                              color: Colors.orange[700],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // 레시피 목록
                    Expanded(
                      child: GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.75,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                        ),
                        itemCount: _savedRecipes.length,
                        itemBuilder: (context, index) {
                          return Stack(
                            children: [
                              RecipeCard(
                                recipe: _savedRecipes[index],
                                onTap: () {
                                  _navigateToRecipeDetail(_savedRecipes[index]);
                                },
                                showSaveButton: false,
                              ),

                              // 저장 해제 버튼
                              Positioned(
                                top: 8,
                                right: 8,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.2),
                                        blurRadius: 4,
                                      ),
                                    ],
                                  ),
                                  child: IconButton(
                                    icon: const Icon(
                                      Icons.bookmark,
                                      color: Colors.orange,
                                    ),
                                    onPressed: () {
                                      _showRemoveDialog(
                                          _savedRecipes[index], index);
                                    },
                                    padding: const EdgeInsets.all(8),
                                    constraints: const BoxConstraints(),
                                  ),
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),
                  ],
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

  void _showRemoveDialog(Recipe recipe, int index) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('저장 해제'),
          content: Text('${recipe.title}을(를) 저장 목록에서 제거하시겠습니까?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('취소'),
            ),
            TextButton(
              onPressed: () {
                _removeSavedRecipe(index);
                Navigator.of(context).pop();
              },
              child: const Text(
                '제거',
                style: TextStyle(color: Colors.red),
              ),
            ),
          ],
        );
      },
    );
  }

  void _removeSavedRecipe(int index) {
    final removedRecipe = _savedRecipes[index];
    setState(() {
      _savedRecipes.removeAt(index);
    });

    // 실행 취소 스낵바
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${removedRecipe.title}이(가) 저장 목록에서 제거되었습니다'),
        action: SnackBarAction(
          label: '실행 취소',
          onPressed: () {
            setState(() {
              _savedRecipes.insert(index, removedRecipe);
            });
          },
        ),
        duration: const Duration(seconds: 3),
      ),
    );
  }
}
