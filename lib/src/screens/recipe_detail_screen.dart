import 'package:flutter/material.dart';
import '../../core/constants.dart';

class RecipeDetailScreen extends StatefulWidget {
  final Map<String, dynamic> recipe;

  const RecipeDetailScreen({super.key, required this.recipe});

  @override
  State<RecipeDetailScreen> createState() => _RecipeDetailScreenState();
}

class _RecipeDetailScreenState extends State<RecipeDetailScreen> {
  bool isLiked = false;
  bool isSaved = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          // 상단 이미지와 앱바
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            backgroundColor: kYellowColor,
            foregroundColor: kBlackColor,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                children: [
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                    ),
                    child: widget.recipe.containsKey('imageUrl') &&
                            widget.recipe['imageUrl'] != null &&
                            widget.recipe['imageUrl'].toString().isNotEmpty
                        ? Image.asset(
                            '${widget.recipe['imageUrl']}',
                            width: double.infinity,
                            height: double.infinity,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return const Center(
                                child: Icon(
                                  Icons.restaurant_menu,
                                  size: 120,
                                  color: Colors.grey,
                                ),
                              );
                            },
                          )
                        : const Center(
                            child: Icon(
                              Icons.restaurant_menu,
                              size: 120,
                              color: Colors.grey,
                            ),
                          ),
                  ),
                  // 그라데이션 오버레이
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      height: 100,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                          colors: [
                            Colors.black.withOpacity(0.7),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 레시피 상세 내용
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 요리 이름
                  Text(
                    widget.recipe['title'] ?? '파스타 알리오 올리오',
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: kBlackColor,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 좋아요, 저장 버튼
                  Row(
                    children: [
                      _buildActionButton(
                        icon: isLiked ? Icons.favorite : Icons.favorite_border,
                        label: '좋아요',
                        count: '124',
                        isActive: isLiked,
                        onTap: () {
                          setState(() {
                            isLiked = !isLiked;
                          });
                        },
                      ),
                      const SizedBox(width: 16),
                      _buildActionButton(
                        icon: isSaved ? Icons.bookmark : Icons.bookmark_border,
                        label: '저장',
                        count: '32',
                        isActive: isSaved,
                        onTap: () {
                          setState(() {
                            isSaved = !isSaved;
                          });
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // 설명
                  const Text(
                    '마늘과 올리브오일의 심플하면서도 깊은 맛이 일품인 이탈리아 대표 파스타 요리입니다. 간단한 재료로도 레스토랑 못지않은 맛을 낼 수 있어요.',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 심볼, 조리시간, 난이도
                  Row(
                    children: [
                      _buildInfoChip('🇮🇹', '이탈리아'),
                      const SizedBox(width: 8),
                      _buildInfoChip('🥗', '비건'),
                      const SizedBox(width: 8),
                      _buildInfoChip('⏰', '20분'),
                      const SizedBox(width: 8),
                      _buildInfoChip('⭐', '쉬움'),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // 태그
                  const Text(
                    '태그',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: kBlackColor,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: ['비건', '단백질', '저염식', '저속노화', '에너지충전']
                        .map((tag) => _buildTag(tag))
                        .toList(),
                  ),
                  const SizedBox(height: 32),

                  // 재료
                  const Text(
                    '재료',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: kBlackColor,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey[200]!),
                    ),
                    child: const Column(
                      children: [
                        _IngredientItem(name: '스파게티면', amount: '200g'),
                        _IngredientItem(name: '마늘', amount: '4쪽'),
                        _IngredientItem(name: '올리브오일', amount: '4T'),
                        _IngredientItem(name: '페페론치노', amount: '1개'),
                        _IngredientItem(name: '파슬리', amount: '2T'),
                        _IngredientItem(name: '소금', amount: '약간'),
                        _IngredientItem(name: '후추', amount: '약간'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // 조리순서
                  const Text(
                    '조리순서',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: kBlackColor,
                    ),
                  ),
                  const SizedBox(height: 16),

                  ...cookingSteps.map((step) => _CookingStep(
                        stepNumber: step['step'],
                        description: step['description'],
                        imageUrl: step['imageUrl'],
                      )),

                  const SizedBox(height: 32),

                  // 댓글
                  const Text(
                    '댓글',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: kBlackColor,
                    ),
                  ),
                  const SizedBox(height: 16),

                  ...comments.map((comment) => _CommentItem(
                        userName: comment['userName'],
                        comment: comment['comment'],
                        time: comment['time'],
                        userImage: comment['userImage'],
                      )),

                  // 댓글 입력
                  Container(
                    margin: const EdgeInsets.only(top: 16),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey[300]!),
                    ),
                    child: TextField(
                      decoration: InputDecoration(
                        hintText: '댓글을 입력하세요...',
                        hintStyle: TextStyle(color: Colors.grey[400]),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.all(16),
                        suffixIcon: Container(
                          margin: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: kYellowColor,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(
                            Icons.send,
                            color: kBlackColor,
                            size: 20,
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required String count,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isActive ? kYellowColor : Colors.grey[100],
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActive ? kYellowColor : Colors.grey[300]!,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isActive ? kBlackColor : Colors.grey,
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(
              '$label $count',
              style: TextStyle(
                color: isActive ? kBlackColor : Colors.grey,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoChip(String emoji, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(
              fontSize: 14,
              color: kBlackColor,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTag(String tag) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: kYellowColor.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kYellowColor.withOpacity(0.5)),
      ),
      child: Text(
        tag,
        style: const TextStyle(
          fontSize: 12,
          color: kBlackColor,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

class _IngredientItem extends StatelessWidget {
  final String name;
  final String amount;

  const _IngredientItem({required this.name, required this.amount});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            name,
            style: const TextStyle(
              fontSize: 16,
              color: kBlackColor,
            ),
          ),
          Text(
            amount,
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _CookingStep extends StatelessWidget {
  final int stepNumber;
  final String description;
  final String? imageUrl;

  const _CookingStep({
    required this.stepNumber,
    required this.description,
    required this.imageUrl,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 스텝 번호
          Container(
            width: 32,
            height: 32,
            decoration: const BoxDecoration(
              color: kYellowColor,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                stepNumber.toString(),
                style: const TextStyle(
                  color: kBlackColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),

          // 사진과 설명
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 사진 영역
                Container(
                  height: 120,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: imageUrl != null && imageUrl!.isNotEmpty
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.asset(
                            '$imageUrl',
                            width: double.infinity,
                            height: 120,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return const Center(
                                child: Icon(
                                  Icons.camera_alt,
                                  size: 40,
                                  color: Colors.grey,
                                ),
                              );
                            },
                          ),
                        )
                      : const Center(
                          child: Icon(
                            Icons.camera_alt,
                            size: 40,
                            color: Colors.grey,
                          ),
                        ),
                ),
                const SizedBox(height: 12),

                // 설명
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 15,
                    color: kBlackColor,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CommentItem extends StatelessWidget {
  final String userName;
  final String comment;
  final String time;
  final String? userImage;

  const _CommentItem({
    required this.userName,
    required this.comment,
    required this.time,
    this.userImage,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 프로필 이미지
          CircleAvatar(
            radius: 20,
            backgroundColor: kYellowColor,
            backgroundImage: userImage != null && userImage!.isNotEmpty
                ? AssetImage(userImage!)
                : null,
            child: (userImage == null || userImage!.isEmpty)
                ? const Icon(
                    Icons.person,
                    color: kBlackColor,
                    size: 20,
                  )
                : null,
          ),
          const SizedBox(width: 12),

          // 댓글 내용
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      userName,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: kBlackColor,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      time,
                      style: TextStyle(
                        color: Colors.grey[500],
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  comment,
                  style: const TextStyle(
                    color: kBlackColor,
                    fontSize: 14,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// 더미 데이터
final List<Map<String, dynamic>> cookingSteps = [
  {
    'step': 1,
    'description': '큰 냄비에 물을 끓이고 소금을 넣어 스파게티면을 포장지 표시 시간보다 1분 적게 삶아주세요.',
  },
  {
    'step': 2,
    'description': '마늘을 얇게 슬라이스하고 페페론치노는 씨를 제거한 후 잘게 썰어주세요.',
  },
  {
    'step': 3,
    'description': '팬에 올리브오일을 두르고 마늘과 페페론치노를 넣어 약불에서 향이 날 때까지 볶아주세요.',
  },
  {
    'step': 4,
    'description': '삶은 면과 면수를 조금 넣고 빠르게 볶아 유화시켜주세요. 파슬리와 후추를 넣어 마무리합니다.',
  },
];

final List<Map<String, dynamic>> comments = [
  {
    'userName': '요리마스터',
    'comment': '정말 간단하면서도 맛있어요! 마늘 향이 너무 좋네요.',
    'time': '2시간 전',
    'userImage': '',
  },
  {
    'userName': '파스타러버',
    'comment': '레시피 따라했는데 레스토랑 못지않은 맛이 나왔어요. 감사합니다!',
    'time': '1일 전',
    'userImage': '',
  },
  {
    'userName': '초보쿡',
    'comment': '면수를 넣는 게 포인트였네요. 다음엔 더 맛있게 만들 수 있을 것 같아요.',
    'time': '3일 전',
    'userImage': '',
  },
];
