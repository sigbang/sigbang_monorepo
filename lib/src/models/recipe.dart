class Recipe {
  final String id;
  final String userId;
  final String mainImageUrl;
  final String title;
  final String country;
  final String description;
  final int cookTimeMinutes;
  final String difficulty; // "쉬움", "보통", "어려움"
  final List<String> ingredients; // 예: ["양파 1개", "마늘 2쪽"]
  final List<RecipeStep> steps;
  final DateTime createdAt;
  final String authorName;
  final String? authorProfileUrl;

  const Recipe({
    required this.id,
    required this.userId,
    required this.mainImageUrl,
    required this.title,
    required this.country,
    required this.description,
    required this.cookTimeMinutes,
    required this.difficulty,
    required this.ingredients,
    required this.steps,
    required this.createdAt,
    required this.authorName,
    this.authorProfileUrl,
  });

  factory Recipe.fromJson(Map<String, dynamic> json) {
    return Recipe(
      id: json['id'],
      userId: json['user_id'],
      mainImageUrl: json['main_image_url'],
      title: json['title'],
      country: json['country'],
      description: json['description'],
      cookTimeMinutes: json['cook_time_minutes'],
      difficulty: json['difficulty'],
      ingredients: List<String>.from(json['ingredients']),
      steps: (json['steps'] as List)
          .map((step) => RecipeStep.fromJson(step))
          .toList(),
      createdAt: DateTime.parse(json['created_at']),
      authorName: json['author_name'] ?? '',
      authorProfileUrl: json['author_profile_url'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'main_image_url': mainImageUrl,
      'title': title,
      'country': country,
      'description': description,
      'cook_time_minutes': cookTimeMinutes,
      'difficulty': difficulty,
      'ingredients': ingredients,
      'steps': steps.map((step) => step.toJson()).toList(),
      'created_at': createdAt.toIso8601String(),
      'author_name': authorName,
      'author_profile_url': authorProfileUrl,
    };
  }
}

class RecipeStep {
  final int stepNumber;
  final String description;
  final String? imageUrl;

  const RecipeStep({
    required this.stepNumber,
    required this.description,
    this.imageUrl,
  });

  factory RecipeStep.fromJson(Map<String, dynamic> json) {
    return RecipeStep(
      stepNumber: json['step_number'],
      description: json['description'],
      imageUrl: json['image_url'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'step_number': stepNumber,
      'description': description,
      'image_url': imageUrl,
    };
  }
}
