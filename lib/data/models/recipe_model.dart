import '../../domain/entities/recipe.dart';

class RecipeModel extends Recipe {
  const RecipeModel({
    required super.id,
    required super.title,
    required super.description,
    required super.status,
    required super.createdAt,
    required super.updatedAt,
    super.ingredients,
    super.cookingTime,
    super.servings,
    super.difficulty,
    super.viewCount,
    super.likesCount,
    super.commentsCount,
    super.thumbnailUrl,
    super.author,
    super.tags,
    super.steps,
    super.isLiked,
    super.isSaved,
  });

  factory RecipeModel.fromJson(Map<String, dynamic> json) {
    return RecipeModel(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      status: RecipeStatus.fromString(json['status'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      ingredients: json['ingredients'] as String?,
      cookingTime: json['cookingTime'] as int?,
      servings: json['servings'] as int?,
      difficulty: json['difficulty'] != null
          ? RecipeDifficulty.fromString(json['difficulty'] as String)
          : null,
      viewCount: json['viewCount'] as int? ?? 0,
      likesCount: json['likesCount'] as int? ?? 0,
      commentsCount: json['commentsCount'] as int? ?? 0,
      thumbnailUrl: json['thumbnailImage'] as String?,
      author: json['author'] != null
          ? AuthorModel.fromJson(json['author'] as Map<String, dynamic>)
          : null,
      tags: (json['tags'] as List<dynamic>?)
              ?.map(
                  (tag) => RecipeTagModel.fromJson(tag as Map<String, dynamic>))
              .toList() ??
          [],
      steps: (json['steps'] as List<dynamic>?)
              ?.map((step) =>
                  RecipeStepModel.fromJson(step as Map<String, dynamic>))
              .toList() ??
          [],
      isLiked: json['isLiked'] as bool? ?? false,
      isSaved: json['isSaved'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'status': status.value,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      if (ingredients != null) 'ingredients': ingredients,
      if (cookingTime != null) 'cookingTime': cookingTime,
      if (servings != null) 'servings': servings,
      if (difficulty != null) 'difficulty': difficulty!.value,
      'viewCount': viewCount,
      'likesCount': likesCount,
      'commentsCount': commentsCount,
      if (thumbnailUrl != null) 'thumbnailUrl': thumbnailUrl,
      if (author != null) 'author': (author as AuthorModel).toJson(),
      'tags': tags.map((tag) => (tag as RecipeTagModel).toJson()).toList(),
      'steps': steps.map((step) => (step as RecipeStepModel).toJson()).toList(),
      'isLiked': isLiked,
      'isSaved': isSaved,
    };
  }

  factory RecipeModel.fromDomain(Recipe recipe) {
    return RecipeModel(
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      status: recipe.status,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      ingredients: recipe.ingredients,
      cookingTime: recipe.cookingTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      viewCount: recipe.viewCount,
      likesCount: recipe.likesCount,
      commentsCount: recipe.commentsCount,
      thumbnailUrl: recipe.thumbnailUrl,
      author: recipe.author,
      tags: recipe.tags,
      steps: recipe.steps,
      isLiked: recipe.isLiked,
      isSaved: recipe.isSaved,
    );
  }

  Recipe toDomain() {
    return Recipe(
      id: id,
      title: title,
      description: description,
      status: status,
      createdAt: createdAt,
      updatedAt: updatedAt,
      ingredients: ingredients,
      cookingTime: cookingTime,
      servings: servings,
      difficulty: difficulty,
      viewCount: viewCount,
      likesCount: likesCount,
      commentsCount: commentsCount,
      thumbnailUrl: thumbnailUrl,
      author: author,
      tags: tags,
      steps: steps,
      isLiked: isLiked,
      isSaved: isSaved,
    );
  }
}

class AuthorModel extends Author {
  const AuthorModel({
    required super.id,
    required super.nickname,
    super.profileImage,
  });

  factory AuthorModel.fromJson(Map<String, dynamic> json) {
    return AuthorModel(
      id: json['id'] as String,
      nickname: json['nickname'] as String,
      profileImage: json['profileImage'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nickname': nickname,
      if (profileImage != null) 'profileImage': profileImage,
    };
  }
}

class RecipeTagModel extends RecipeTag {
  const RecipeTagModel({
    required super.name,
    super.emoji,
  });

  factory RecipeTagModel.fromJson(Map<String, dynamic> json) {
    return RecipeTagModel(
      name: json['name'] as String,
      emoji: json['emoji'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      if (emoji != null) 'emoji': emoji,
    };
  }
}

class RecipeStepModel extends RecipeStep {
  const RecipeStepModel({
    required super.order,
    required super.description,
    super.imageUrl,
  });

  factory RecipeStepModel.fromJson(Map<String, dynamic> json) {
    return RecipeStepModel(
      order: json['order'] as int,
      description: json['description'] as String,
      imageUrl: json['imageUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'order': order,
      'description': description,
      if (imageUrl != null) 'imageUrl': imageUrl,
    };
  }
}
