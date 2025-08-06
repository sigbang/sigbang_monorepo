import 'package:equatable/equatable.dart';
import 'recipe.dart';

class RecipeQuery extends Equatable {
  const RecipeQuery({
    this.page = 1,
    this.limit = 10,
    this.search,
    this.tags,
    this.difficulty,
    this.cookingTimeMax,
    this.servings,
    this.authorId,
  });

  final int page;
  final int limit;
  final String? search;
  final List<String>? tags;
  final String? difficulty;
  final int? cookingTimeMax;
  final int? servings;
  final String? authorId;

  @override
  List<Object?> get props => [
        page,
        limit,
        search,
        tags,
        difficulty,
        cookingTimeMax,
        servings,
        authorId,
      ];

  RecipeQuery copyWith({
    int? page,
    int? limit,
    String? search,
    List<String>? tags,
    String? difficulty,
    int? cookingTimeMax,
    int? servings,
    String? authorId,
  }) {
    return RecipeQuery(
      page: page ?? this.page,
      limit: limit ?? this.limit,
      search: search ?? this.search,
      tags: tags ?? this.tags,
      difficulty: difficulty ?? this.difficulty,
      cookingTimeMax: cookingTimeMax ?? this.cookingTimeMax,
      servings: servings ?? this.servings,
      authorId: authorId ?? this.authorId,
    );
  }

  Map<String, dynamic> toQueryParameters() {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
    };

    if (search != null && search!.isNotEmpty) {
      params['search'] = search;
    }
    if (tags != null && tags!.isNotEmpty) {
      params['tags'] = tags!.join(',');
    }
    if (difficulty != null) {
      params['difficulty'] = difficulty;
    }
    if (cookingTimeMax != null) {
      params['cookingTimeMax'] = cookingTimeMax;
    }
    if (servings != null) {
      params['servings'] = servings;
    }
    if (authorId != null) {
      params['authorId'] = authorId;
    }

    return params;
  }
}

class PaginatedRecipes extends Equatable {
  const PaginatedRecipes({
    required this.recipes,
    required this.pagination,
  });

  final List<Recipe> recipes;
  final Pagination pagination;

  @override
  List<Object?> get props => [recipes, pagination];
}

class Pagination extends Equatable {
  const Pagination({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  final int page;
  final int limit;
  final int total;
  final int totalPages;

  bool get hasNextPage => page < totalPages;
  bool get hasPreviousPage => page > 1;

  @override
  List<Object?> get props => [page, limit, total, totalPages];
}
