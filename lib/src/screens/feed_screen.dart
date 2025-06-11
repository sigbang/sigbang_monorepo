import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../models/recipe_model.dart';
import '../data/sample_recipes.dart';
import 'recipe_detail_screen.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  List<Recipe> recipes = [];
  String selectedFilter = '전체';
  final List<String> filters = ['전체', '비건', '한식', '양식', '일식', '간편요리'];

  @override
  void initState() {
    super.initState();
    recipes = SampleRecipes.getSampleRecipes();
  }

  List<Recipe> get filteredRecipes {
    if (selectedFilter == '전체') return recipes;

    return recipes.where((recipe) {
      switch (selectedFilter) {
        case '비건':
          return recipe.isVegan;
        case '한식':
          return recipe.country == '한국';
        case '양식':
          return recipe.country == '이탈리아' || recipe.country == '미국';
        case '일식':
          return recipe.country == '일본';
        case '간편요리':
          return recipe.difficulty == '쉬움';
        default:
          return true;
      }
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // 상단 제목과 필터
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '레시피 피드',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: kBlackColor,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 필터 버튼들
                  SizedBox(
                    height: 40,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: filters.length,
                      itemBuilder: (context, index) {
                        final filter = filters[index];
                        final isSelected = selectedFilter == filter;

                        return Container(
                          margin: const EdgeInsets.only(right: 8),
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                selectedFilter = filter;
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? kYellowColor
                                    : Colors.grey[200],
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                filter,
                                style: TextStyle(
                                  color: isSelected
                                      ? kBlackColor
                                      : Colors.grey[600],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),

            // 레시피 리스트
            Expanded(
              child: filteredRecipes.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.restaurant_menu,
                            size: 80,
                            color: Colors.grey,
                          ),
                          SizedBox(height: 16),
                          Text(
                            '해당 조건의 레시피가 없습니다',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: filteredRecipes.length,
                      itemBuilder: (context, index) {
                        final recipe = filteredRecipes[index];
                        return FeedRecipeCard(
                          recipe: recipe,
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    RecipeDetailScreen(recipe: recipe.toJson()),
                              ),
                            );
                          },
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class FeedRecipeCard extends StatefulWidget {
  final Recipe recipe;
  final VoidCallback onTap;

  const FeedRecipeCard({
    super.key,
    required this.recipe,
    required this.onTap,
  });

  @override
  State<FeedRecipeCard> createState() => _FeedRecipeCardState();
}

class _FeedRecipeCardState extends State<FeedRecipeCard> {
  bool isLiked = false;
  bool isSaved = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 24),
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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 이미지 영역
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Stack(
                children: [
                  const Center(
                    child: Icon(
                      Icons.restaurant_menu,
                      size: 80,
                      color: Colors.grey,
                    ),
                  ),

                  // 좋아요, 저장 버튼
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Row(
                      children: [
                        _buildActionButton(
                          icon:
                              isLiked ? Icons.favorite : Icons.favorite_border,
                          isActive: isLiked,
                          onTap: () {
                            setState(() {
                              isLiked = !isLiked;
                            });
                          },
                        ),
                        const SizedBox(width: 8),
                        _buildActionButton(
                          icon:
                              isSaved ? Icons.bookmark : Icons.bookmark_border,
                          isActive: isSaved,
                          onTap: () {
                            setState(() {
                              isSaved = !isSaved;
                            });
                          },
                        ),
                      ],
                    ),
                  ),

                  // 평점
                  Positioned(
                    bottom: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.7),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star,
                              color: Colors.yellow, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            widget.recipe.rating.toString(),
                            style: const TextStyle(
                                color: Colors.white, fontSize: 14),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // 내용 영역
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 제목
                  Text(
                    widget.recipe.title,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: kBlackColor,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // 작성자
                  Row(
                    children: [
                      const CircleAvatar(
                        radius: 12,
                        backgroundColor: kYellowColor,
                        child: Icon(Icons.person, size: 16, color: kBlackColor),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        widget.recipe.author,
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // 설명
                  Text(
                    widget.recipe.description,
                    style: TextStyle(
                      color: Colors.grey[700],
                      fontSize: 14,
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 12),

                  // 정보 칩들
                  Row(
                    children: [
                      _buildInfoChip(
                          widget.recipe.countryFlag, widget.recipe.country),
                      const SizedBox(width: 8),
                      _buildInfoChip('⏰', '${widget.recipe.duration}분'),
                      const SizedBox(width: 8),
                      _buildInfoChip('⭐', widget.recipe.difficulty),
                      if (widget.recipe.isVegan) ...[
                        const SizedBox(width: 8),
                        _buildInfoChip('🥗', '비건'),
                      ],
                    ],
                  ),
                  const SizedBox(height: 12),

                  // 좋아요, 댓글 수
                  Row(
                    children: [
                      Icon(Icons.favorite_border,
                          size: 16, color: Colors.grey[600]),
                      const SizedBox(width: 4),
                      Text(
                        widget.recipe.likeCount.toString(),
                        style: TextStyle(color: Colors.grey[600], fontSize: 14),
                      ),
                      const SizedBox(width: 16),
                      Icon(Icons.chat_bubble_outline,
                          size: 16, color: Colors.grey[600]),
                      const SizedBox(width: 4),
                      Text(
                        widget.recipe.comments.length.toString(),
                        style: TextStyle(color: Colors.grey[600], fontSize: 14),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.9),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Icon(
          icon,
          color: isActive ? Colors.red : Colors.grey,
          size: 20,
        ),
      ),
    );
  }

  Widget _buildInfoChip(String emoji, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 12)),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(
              fontSize: 12,
              color: kBlackColor,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
