import '../../domain/entities/recipe_query.dart';
import 'recipe_model.dart';

class PaginatedRecipesModel extends PaginatedRecipes {
  const PaginatedRecipesModel({
    required super.recipes,
    required super.pagination,
  });

  factory PaginatedRecipesModel.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? json;
    return PaginatedRecipesModel(
      recipes: (data['recipes'] as List<dynamic>)
          .map((recipe) => RecipeModel.fromJson(recipe as Map<String, dynamic>))
          .toList(),
      pagination: PaginationModel.fromJson(
          (data['pageInfo'] ?? data['pagination']) as Map<String, dynamic>),
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
