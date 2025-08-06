import '../../domain/entities/recipe_query.dart';
import 'recipe_model.dart';

class PaginatedRecipesModel extends PaginatedRecipes {
  const PaginatedRecipesModel({
    required super.recipes,
    required super.pagination,
  });

  factory PaginatedRecipesModel.fromJson(Map<String, dynamic> json) {
    return PaginatedRecipesModel(
      recipes: (json['recipes'] as List<dynamic>)
          .map((recipe) => RecipeModel.fromJson(recipe as Map<String, dynamic>))
          .toList(),
      pagination:
          PaginationModel.fromJson(json['pagination'] as Map<String, dynamic>),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'recipes':
          recipes.map((recipe) => (recipe as RecipeModel).toJson()).toList(),
      'pagination': (pagination as PaginationModel).toJson(),
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
    required super.page,
    required super.limit,
    required super.total,
    required super.totalPages,
  });

  factory PaginationModel.fromJson(Map<String, dynamic> json) {
    return PaginationModel(
      page: json['page'] as int,
      limit: json['limit'] as int,
      total: json['total'] as int,
      totalPages: json['totalPages'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'page': page,
      'limit': limit,
      'total': total,
      'totalPages': totalPages,
    };
  }
}
