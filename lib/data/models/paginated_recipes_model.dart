import '../../domain/entities/recipe_query.dart';
import 'recipe_model.dart';

class PaginatedRecipesModel extends PaginatedRecipes {
  const PaginatedRecipesModel({
    required super.recipes,
    required super.pagination,
  });

  factory PaginatedRecipesModel.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? json;

    // Support multiple payload shapes: recipes | items | results | list
    final rawList = (data['recipes'] ??
            data['items'] ??
            data['results'] ??
            data['list']) as List<dynamic>? ??
        const [];

    final recipes = rawList
        .map((recipe) => RecipeModel.fromJson(recipe as Map<String, dynamic>))
        .toList();

    // Page info may be nested or flat; build a map robustly
    final Map<String, dynamic> pageInfoMap =
        (data['pageInfo'] as Map<String, dynamic>?) ??
            (data['pagination'] as Map<String, dynamic>?) ??
            (json['pageInfo'] as Map<String, dynamic>?) ??
            (json['pagination'] as Map<String, dynamic>?) ??
            <String, dynamic>{};

    // Fallbacks for cursor/limit if not present in map
    pageInfoMap.putIfAbsent(
        'nextCursor',
        () =>
            data['nextCursor'] ??
            data['cursor'] ??
            json['nextCursor'] ??
            json['cursor']);
    pageInfoMap.putIfAbsent(
        'limit', () => data['limit'] ?? json['limit'] ?? 20);

    return PaginatedRecipesModel(
      recipes: recipes,
      pagination: PaginationModel.fromJson(pageInfoMap),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'recipes':
          recipes.map((recipe) => (recipe as RecipeModel).toJson()).toList(),
      'pageInfo': (pagination as PaginationModel).toJson(),
    };
  }

  PaginatedRecipes toDomain() {
    return PaginatedRecipes(
      recipes:
          recipes.map((recipe) => (recipe as RecipeModel).toDomain()).toList(),
      pagination: pagination,
    );
  }
}

class PaginationModel extends Pagination {
  const PaginationModel({
    super.page,
    super.limit,
    super.total,
    super.totalPages,
    super.nextCursor,
    super.newCount,
  });

  factory PaginationModel.fromJson(Map<String, dynamic> json) {
    return PaginationModel(
      page: json['page'] as int? ?? 1,
      limit:
          json['limit'] as int? ?? (json['pageInfo']?['limit'] as int? ?? 10),
      total: json['total'] as int? ?? 0,
      totalPages: json['totalPages'] as int? ?? 1,
      nextCursor: (json['nextCursor'] ??
          json['cursor'] ??
          json['pageInfo']?['nextCursor']) as String?,
      newCount: (json['newCount'] ?? json['pageInfo']?['newCount']) as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'page': page,
      'limit': limit,
      'total': total,
      'totalPages': totalPages,
      if (nextCursor != null) 'nextCursor': nextCursor,
      if (newCount != null) 'newCount': newCount,
    };
  }
}
