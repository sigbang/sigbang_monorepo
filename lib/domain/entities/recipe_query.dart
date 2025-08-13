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
    this.sortBy,
    this.followingBoost,
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
  final String? sortBy; // latest|popular|views
  final bool? followingBoost;
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
        sortBy,
        followingBoost,
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
    String? sortBy,
    bool? followingBoost,
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
      sortBy: sortBy ?? this.sortBy,
      followingBoost: followingBoost ?? this.followingBoost,
      servings: servings ?? this.servings,
      authorId: authorId ?? this.authorId,
    );
  }

  Map<String, dynamic> toQueryParameters() {
    final params = <String, dynamic>{
      // Clamp to server constraints to prevent 400 validation errors
      'limit': limit.clamp(1, 50).toInt(),
    };

    if (cursor != null && cursor!.isNotEmpty) {
      params['cursor'] = cursor;
    }
    if (since != null) {
      // Use UTC to match server examples like 2025-08-13T12:34:56.000Z
      params['since'] = since!.toUtc().toIso8601String();
    }
    if (search != null && search!.isNotEmpty) {
      params['search'] = search;
    }
    if (tag != null && tag!.isNotEmpty) {
      params['tag'] = tag;
    }
    if (difficulty != null && difficulty!.isNotEmpty) {
      // Normalize to server enum format (EASY|MEDIUM|HARD)
      params['difficulty'] = difficulty!.toUpperCase();
    }
    if (maxCookingTime != null) {
      params['maxCookingTime'] = maxCookingTime;
    }
    if (sortBy != null && sortBy!.isNotEmpty) {
      params['sortBy'] = sortBy;
    }
    if (followingBoost != null) {
      params['followingBoost'] = followingBoost;
    }
    // Note: Do not include non-DTO fields (e.g., servings, authorId) for /recipes/feed

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
