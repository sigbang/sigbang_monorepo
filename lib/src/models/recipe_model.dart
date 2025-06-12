class Recipe {
  final String id;
  final String title;
  final String description;
  final String imageUrl;
  final String author;
  final String authorImageUrl;
  final double rating;
  final int duration; // 분 단위
  final String difficulty; // '쉬움', '보통', '어려움'
  final String country;
  final String countryFlag;
  final bool isVegan;
  final bool isFusion;
  final List<String> tags;
  final List<Ingredient> ingredients;
  final List<CookingStep> cookingSteps;
  final List<Comment> comments;
  final int likeCount;
  final int saveCount;

  Recipe({
    required this.id,
    required this.title,
    required this.description,
    required this.imageUrl,
    required this.author,
    required this.authorImageUrl,
    required this.rating,
    required this.duration,
    required this.difficulty,
    required this.country,
    required this.countryFlag,
    required this.isVegan,
    required this.isFusion,
    required this.tags,
    required this.ingredients,
    required this.cookingSteps,
    required this.comments,
    required this.likeCount,
    required this.saveCount,
  });

  factory Recipe.fromJson(Map<String, dynamic> json) {
    return Recipe(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      imageUrl: json['imageUrl'],
      author: json['author'],
      authorImageUrl: json['authorImageUrl'],
      rating: json['rating'].toDouble(),
      duration: json['duration'],
      difficulty: json['difficulty'],
      country: json['country'],
      countryFlag: json['countryFlag'],
      isVegan: json['isVegan'],
      isFusion: json['isFusion'],
      tags: List<String>.from(json['tags']),
      ingredients: (json['ingredients'] as List)
          .map((i) => Ingredient.fromJson(i))
          .toList(),
      cookingSteps: (json['cookingSteps'] as List)
          .map((s) => CookingStep.fromJson(s))
          .toList(),
      comments:
          (json['comments'] as List).map((c) => Comment.fromJson(c)).toList(),
      likeCount: json['likeCount'],
      saveCount: json['saveCount'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'imageUrl': imageUrl,
      'author': author,
      'authorImageUrl': authorImageUrl,
      'rating': rating,
      'duration': duration,
      'difficulty': difficulty,
      'country': country,
      'countryFlag': countryFlag,
      'isVegan': isVegan,
      'isFusion': isFusion,
      'tags': tags,
      'ingredients': ingredients.map((i) => i.toJson()).toList(),
      'cookingSteps': cookingSteps.map((s) => s.toJson()).toList(),
      'comments': comments.map((c) => c.toJson()).toList(),
      'likeCount': likeCount,
      'saveCount': saveCount,
    };
  }
}

class Ingredient {
  final String name;
  final String amount;

  Ingredient({
    required this.name,
    required this.amount,
  });

  factory Ingredient.fromJson(Map<String, dynamic> json) {
    return Ingredient(
      name: json['name'],
      amount: json['amount'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'amount': amount,
    };
  }
}

class CookingStep {
  final int stepNumber;
  final String description;
  final String imageUrl;

  CookingStep({
    required this.stepNumber,
    required this.description,
    required this.imageUrl,
  });

  factory CookingStep.fromJson(Map<String, dynamic> json) {
    return CookingStep(
      stepNumber: json['stepNumber'],
      description: json['description'],
      imageUrl: json['imageUrl'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'stepNumber': stepNumber,
      'description': description,
      'imageUrl': imageUrl,
    };
  }
}

class Comment {
  final String id;
  final String userName;
  final String comment;
  final String time;
  final String userImage;

  Comment({
    required this.id,
    required this.userName,
    required this.comment,
    required this.time,
    required this.userImage,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'],
      userName: json['userName'],
      comment: json['comment'],
      time: json['time'],
      userImage: json['userImage'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userName': userName,
      'comment': comment,
      'time': time,
      'userImage': userImage,
    };
  }
}
