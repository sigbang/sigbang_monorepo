import 'package:equatable/equatable.dart';
import 'recipe.dart';

class RecipeQuery extends Equatable {
  const RecipeQuery({
    this.limit = 10,
    this.cursor,
    this.since,
    this.search,
    this.tag,
    this.difficulty,
    this.maxCookingTime,
    this.servings,
    this.authorId,
  });

  final int limit;
  final String? cursor;
  final DateTime? since;
  final String? search;
  final String? tag; // 경량 카테고리 필터 (단일)
  final String? difficulty; // EASY|MEDIUM|HARD
  final int? maxCookingTime;
  final int? servings;
  final String? authorId;

  @override
  List<Object?> get props => [
        limit,
        cursor,
        since,
        search,
        tag,
        difficulty,
        maxCookingTime,
        servings,
        authorId,
      ];

  RecipeQuery copyWith({
    int? limit,
    String? cursor,
    DateTime? since,
    String? search,
    String? tag,
    String? difficulty,
    int? maxCookingTime,
    int? servings,
    String? authorId,
  }) {
    return RecipeQuery(
      limit: limit ?? this.limit,
      cursor: cursor ?? this.cursor,
      since: since ?? this.since,
      search: search ?? this.search,
      tag: tag ?? this.tag,
      difficulty: difficulty ?? this.difficulty,
      maxCookingTime: maxCookingTime ?? this.maxCookingTime,
      servings: servings ?? this.servings,
      authorId: authorId ?? this.authorId,
    );
  }

  Map<String, dynamic> toQueryParameters() {
    final params = <String, dynamic>{
      'limit': limit,
    };

    if (cursor != null && cursor!.isNotEmpty) {
      params['cursor'] = cursor;
    }
    if (since != null) {
      params['since'] = since!.toIso8601String();
    }
    if (search != null && search!.isNotEmpty) {
      params['search'] = search;
    }
    if (tag != null && tag!.isNotEmpty) {
      params['tag'] = tag;
    }
    if (difficulty != null && difficulty!.isNotEmpty) {
      params['difficulty'] = difficulty;
    }
    if (maxCookingTime != null) {
      params['maxCookingTime'] = maxCookingTime;
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
    this.page = 1,
    this.limit = 10,
    this.total = 0,
    this.totalPages = 1,
    this.nextCursor,
    this.newCount,
  });

  final int page;
  final int limit;
  final int total;
  final int totalPages;
  final String? nextCursor; // 커서 기반 페이지 정보
  final int? newCount; // since 쿼리 시 신상 개수

  bool get hasNextPage =>
      (nextCursor != null && nextCursor!.isNotEmpty) || page < totalPages;
  bool get hasPreviousPage => page > 1;

  @override
  List<Object?> get props =>
      [page, limit, total, totalPages, nextCursor, newCount];
}
