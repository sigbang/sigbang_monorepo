import 'package:equatable/equatable.dart';

class Recipe extends Equatable {
  const Recipe({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.ingredients,
    this.cookingTime,
    this.servings,
    this.difficulty,
    this.viewCount = 0,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.thumbnailUrl,
    this.author,
    this.tags = const [],
    this.steps = const [],
    this.isLiked = false,
    this.isSaved = false,
    this.linkTitle,
    this.linkUrl,
  });

  final String id;
  final String title;
  final String description;
  final RecipeStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? ingredients;
  final int? cookingTime; // 분 단위
  final int? servings; // 인분
  final RecipeDifficulty? difficulty;
  final int viewCount;
  final int likesCount;
  final int commentsCount;
  final String? thumbnailUrl;
  final Author? author;
  final List<RecipeTag> tags;
  final List<RecipeStep> steps;
  final bool isLiked;
  final bool isSaved;
  final String? linkTitle;
  final String? linkUrl;

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        status,
        createdAt,
        updatedAt,
        ingredients,
        cookingTime,
        servings,
        difficulty,
        viewCount,
        likesCount,
        commentsCount,
        thumbnailUrl,
        author,
        tags,
        steps,
        isLiked,
        isSaved,
        linkTitle,
        linkUrl,
      ];

  Recipe copyWith({
    String? id,
    String? title,
    String? description,
    RecipeStatus? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? ingredients,
    int? cookingTime,
    int? servings,
    RecipeDifficulty? difficulty,
    int? viewCount,
    int? likesCount,
    int? commentsCount,
    String? thumbnailUrl,
    Author? author,
    List<RecipeTag>? tags,
    List<RecipeStep>? steps,
    bool? isLiked,
    bool? isSaved,
    String? linkTitle,
    String? linkUrl,
  }) {
    return Recipe(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      ingredients: ingredients ?? this.ingredients,
      cookingTime: cookingTime ?? this.cookingTime,
      servings: servings ?? this.servings,
      difficulty: difficulty ?? this.difficulty,
      viewCount: viewCount ?? this.viewCount,
      likesCount: likesCount ?? this.likesCount,
      commentsCount: commentsCount ?? this.commentsCount,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      author: author ?? this.author,
      tags: tags ?? this.tags,
      steps: steps ?? this.steps,
      isLiked: isLiked ?? this.isLiked,
      isSaved: isSaved ?? this.isSaved,
      linkTitle: linkTitle ?? this.linkTitle,
      linkUrl: linkUrl ?? this.linkUrl,
    );
  }
}

enum RecipeStatus {
  draft('DRAFT'),
  published('PUBLISHED');

  const RecipeStatus(this.value);
  final String value;

  static RecipeStatus fromString(String value) {
    return RecipeStatus.values.firstWhere(
      (e) => e.value == value,
      orElse: () => RecipeStatus.draft,
    );
  }
}

enum RecipeDifficulty {
  easy('EASY'),
  medium('MEDIUM'),
  hard('HARD');

  const RecipeDifficulty(this.value);
  final String value;

  static RecipeDifficulty fromString(String value) {
    return RecipeDifficulty.values.firstWhere(
      (e) => e.value == value,
      orElse: () => RecipeDifficulty.easy,
    );
  }

  String get displayName {
    switch (this) {
      case RecipeDifficulty.easy:
        return '쉬움';
      case RecipeDifficulty.medium:
        return '보통';
      case RecipeDifficulty.hard:
        return '어려움';
    }
  }
}

class Author extends Equatable {
  const Author({
    required this.id,
    required this.nickname,
    this.profileImage,
  });

  final String id;
  final String nickname;
  final String? profileImage;

  @override
  List<Object?> get props => [id, nickname, profileImage];
}

class RecipeTag extends Equatable {
  const RecipeTag({
    required this.name,
    this.emoji,
  });

  final String name;
  final String? emoji;

  @override
  List<Object?> get props => [name, emoji];
}

class RecipeStep extends Equatable {
  const RecipeStep({
    required this.order,
    required this.description,
    this.imageUrl,
  });

  final int order;
  final String description;
  final String? imageUrl;

  RecipeStep copyWith({
    int? order,
    String? description,
    String? imageUrl,
  }) {
    return RecipeStep(
      order: order ?? this.order,
      description: description ?? this.description,
      imageUrl: imageUrl ?? this.imageUrl,
    );
  }

  @override
  List<Object?> get props => [order, description, imageUrl];
}
