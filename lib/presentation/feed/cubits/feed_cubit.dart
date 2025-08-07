import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter/foundation.dart';
import '../../../domain/entities/recipe.dart';
import '../../../domain/entities/recipe_query.dart';
import '../../../domain/usecases/get_recipe_feed.dart';
import '../../../domain/usecases/get_current_user.dart';
import 'feed_state.dart';

class FeedCubit extends Cubit<FeedState> {
  final GetRecipeFeed _getRecipeFeed;
  final GetCurrentUser _getCurrentUser;

  FeedCubit(
    this._getRecipeFeed,
    this._getCurrentUser,
  ) : super(FeedInitial());

  static const int _pageSize = 10;

  /// 피드 초기 로드
  Future<void> loadFeed() async {
    if (state is FeedLoading) return;

    emit(FeedLoading());

    try {
      // 1. 현재 사용자 확인
      final userResult = await _getCurrentUser();
      final isLoggedIn = userResult.fold(
        (failure) => false,
        (user) => true,
      );

      if (kDebugMode) {
        print('🍽️ Feed loading - isLoggedIn: $isLoggedIn');
      }

      // 2. 피드 데이터 로드
      final query = RecipeQuery(
        page: 1,
        limit: _pageSize,
      );

      final result =
          await _getRecipeFeed(query, isLoggedIn ? 'current_user_id' : null);

      result.fold(
        (failure) {
          if (kDebugMode) {
            print('❌ Feed load failed: ${failure.toString()}');
          }
          emit(FeedError(
            message: '피드를 불러오는데 실패했습니다',
            isLoggedIn: isLoggedIn,
          ));
        },
        (paginatedRecipes) {
          if (kDebugMode) {
            print('✅ Feed loaded: ${paginatedRecipes.recipes.length} recipes');
          }
          emit(FeedLoaded(
            recipes: paginatedRecipes.recipes,
            hasReachedMax: paginatedRecipes.recipes.length < _pageSize,
            isLoggedIn: isLoggedIn,
            currentPage: 1,
          ));
        },
      );
    } catch (e) {
      if (kDebugMode) {
        print('❌ Feed load error: $e');
      }
      emit(FeedError(
        message: '예기치 못한 오류가 발생했습니다',
        isLoggedIn: false,
      ));
    }
  }

  /// 피드 새로고침
  Future<void> refreshFeed() async {
    final currentState = state;
    if (currentState is! FeedLoaded) {
      return loadFeed();
    }

    emit(FeedRefreshing(
      recipes: currentState.recipes,
      isLoggedIn: currentState.isLoggedIn,
      searchQuery: currentState.searchQuery,
      selectedTags: currentState.selectedTags,
    ));

    try {
      final query = RecipeQuery(
        page: 1,
        limit: _pageSize,
        search: currentState.searchQuery,
        tags: currentState.selectedTags,
      );

      final result = await _getRecipeFeed(
          query, currentState.isLoggedIn ? 'current_user_id' : null);

      result.fold(
        (failure) {
          if (kDebugMode) {
            print('❌ Feed refresh failed: ${failure.toString()}');
          }
          emit(currentState.copyWith()); // 원래 상태로 복원
        },
        (paginatedRecipes) {
          if (kDebugMode) {
            print(
                '🔄 Feed refreshed: ${paginatedRecipes.recipes.length} recipes');
          }
          emit(FeedLoaded(
            recipes: paginatedRecipes.recipes,
            hasReachedMax: paginatedRecipes.recipes.length < _pageSize,
            isLoggedIn: currentState.isLoggedIn,
            searchQuery: currentState.searchQuery,
            selectedTags: currentState.selectedTags,
            currentPage: 1,
          ));
        },
      );
    } catch (e) {
      if (kDebugMode) {
        print('❌ Feed refresh error: $e');
      }
      emit(currentState.copyWith()); // 원래 상태로 복원
    }
  }

  /// 더 많은 레시피 로드 (무한 스크롤)
  Future<void> loadMoreRecipes() async {
    final currentState = state;
    if (currentState is! FeedLoaded ||
        currentState.hasReachedMax ||
        currentState is FeedLoadingMore) {
      return;
    }

    emit(FeedLoadingMore(
      recipes: currentState.recipes,
      hasReachedMax: currentState.hasReachedMax,
      isLoggedIn: currentState.isLoggedIn,
      searchQuery: currentState.searchQuery,
      selectedTags: currentState.selectedTags,
      currentPage: currentState.currentPage,
    ));

    try {
      final nextPage = currentState.currentPage + 1;
      final query = RecipeQuery(
        page: nextPage,
        limit: _pageSize,
        search: currentState.searchQuery,
        tags: currentState.selectedTags,
      );

      final result = await _getRecipeFeed(
          query, currentState.isLoggedIn ? 'current_user_id' : null);

      result.fold(
        (failure) {
          if (kDebugMode) {
            print('❌ Load more failed: ${failure.toString()}');
          }
          emit(currentState.copyWith()); // 원래 상태로 복원
        },
        (paginatedRecipes) {
          if (kDebugMode) {
            print(
                '📄 Loaded more: ${paginatedRecipes.recipes.length} recipes (page $nextPage)');
          }

          final allRecipes = List<Recipe>.from(currentState.recipes)
            ..addAll(paginatedRecipes.recipes);

          emit(FeedLoaded(
            recipes: allRecipes,
            hasReachedMax: paginatedRecipes.recipes.length < _pageSize,
            isLoggedIn: currentState.isLoggedIn,
            searchQuery: currentState.searchQuery,
            selectedTags: currentState.selectedTags,
            currentPage: nextPage,
          ));
        },
      );
    } catch (e) {
      if (kDebugMode) {
        print('❌ Load more error: $e');
      }
      emit(currentState.copyWith()); // 원래 상태로 복원
    }
  }

  /// 검색 실행
  Future<void> searchRecipes(String query) async {
    final currentState = state;
    if (currentState is! FeedLoaded) return;

    if (kDebugMode) {
      print('🔍 Searching recipes: "$query"');
    }

    emit(FeedLoading());

    try {
      final searchQuery = RecipeQuery(
        page: 1,
        limit: _pageSize,
        search: query.trim().isEmpty ? null : query.trim(),
        tags: currentState.selectedTags,
      );

      final result = await _getRecipeFeed(
          searchQuery, currentState.isLoggedIn ? 'current_user_id' : null);

      result.fold(
        (failure) {
          if (kDebugMode) {
            print('❌ Search failed: ${failure.toString()}');
          }
          emit(FeedError(
            message: '검색에 실패했습니다',
            isLoggedIn: currentState.isLoggedIn,
          ));
        },
        (paginatedRecipes) {
          if (kDebugMode) {
            print(
                '🔍 Search results: ${paginatedRecipes.recipes.length} recipes');
          }
          emit(FeedLoaded(
            recipes: paginatedRecipes.recipes,
            hasReachedMax: paginatedRecipes.recipes.length < _pageSize,
            isLoggedIn: currentState.isLoggedIn,
            searchQuery: query.trim().isEmpty ? null : query.trim(),
            selectedTags: currentState.selectedTags,
            currentPage: 1,
          ));
        },
      );
    } catch (e) {
      if (kDebugMode) {
        print('❌ Search error: $e');
      }
      emit(FeedError(
        message: '예기치 못한 오류가 발생했습니다',
        isLoggedIn: currentState.isLoggedIn,
      ));
    }
  }

  /// 태그 필터 적용
  Future<void> filterByTags(List<String> tags) async {
    final currentState = state;
    if (currentState is! FeedLoaded) return;

    if (kDebugMode) {
      print('🏷️ Filtering by tags: $tags');
    }

    emit(FeedLoading());

    try {
      final query = RecipeQuery(
        page: 1,
        limit: _pageSize,
        search: currentState.searchQuery,
        tags: tags,
      );

      final result = await _getRecipeFeed(
          query, currentState.isLoggedIn ? 'current_user_id' : null);

      result.fold(
        (failure) {
          if (kDebugMode) {
            print('❌ Filter failed: ${failure.toString()}');
          }
          emit(FeedError(
            message: '필터링에 실패했습니다',
            isLoggedIn: currentState.isLoggedIn,
          ));
        },
        (paginatedRecipes) {
          if (kDebugMode) {
            print(
                '🏷️ Filter results: ${paginatedRecipes.recipes.length} recipes');
          }
          emit(FeedLoaded(
            recipes: paginatedRecipes.recipes,
            hasReachedMax: paginatedRecipes.recipes.length < _pageSize,
            isLoggedIn: currentState.isLoggedIn,
            searchQuery: currentState.searchQuery,
            selectedTags: tags,
            currentPage: 1,
          ));
        },
      );
    } catch (e) {
      if (kDebugMode) {
        print('❌ Filter error: $e');
      }
      emit(FeedError(
        message: '예기치 못한 오류가 발생했습니다',
        isLoggedIn: currentState.isLoggedIn,
      ));
    }
  }

  /// 필터 초기화
  Future<void> clearFilters() async {
    final currentState = state;
    if (currentState is! FeedLoaded) return;

    if (kDebugMode) {
      print('🧹 Clearing all filters');
    }

    await searchRecipes('');
  }
}
