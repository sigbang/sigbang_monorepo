import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter/foundation.dart';
import '../../../domain/entities/recipe.dart';
import '../../../domain/usecases/search_recipes.dart';
import 'search_state.dart';

class SearchCubit extends Cubit<SearchState> {
  final SearchRecipes _searchRecipes;

  SearchCubit(this._searchRecipes) : super(SearchInitial());

  static const int _pageSize = 20;

  /// 초기 화면: 검색창만 보이게 idle 상태
  void showIdle() {
    emit(const SearchIdle());
  }

  /// 검색 실행 (기존 결과 초기화)
  Future<void> search(String query) async {
    final trimmed = query.trim();
    if (trimmed.isEmpty) {
      emit(const SearchIdle());
      return;
    }

    emit(SearchLoading());
    try {
      final result = await _searchRecipes(query: trimmed, limit: _pageSize);
      result.fold(
        (failure) {
          if (kDebugMode) {
            print('❌ Search failed: ${failure.toString()}');
          }
          emit(const SearchError('검색에 실패했습니다'));
        },
        (paginated) {
          if (kDebugMode) {
            print('🔎 Search results: ${paginated.recipes.length}');
          }
          emit(SearchLoaded(
            recipes: paginated.recipes,
            hasReachedMax: !(paginated.pagination.hasNextPage),
            nextCursor: paginated.pagination.nextCursor,
            query: trimmed,
          ));
        },
      );
    } catch (e) {
      emit(const SearchError('예기치 못한 오류가 발생했습니다'));
    }
  }

  /// 다음 페이지 로드
  Future<void> loadMore() async {
    final current = state;
    if (current is! SearchLoaded || current.hasReachedMax) return;

    // Optimistic state is not necessary; keep UI smooth
    try {
      final result = await _searchRecipes(
        query: current.query,
        limit: _pageSize,
        cursor: current.nextCursor,
      );

      result.fold(
        (failure) {
          if (kDebugMode) {
            print('❌ Load more search failed: ${failure.toString()}');
          }
          // keep current state
        },
        (paginated) {
          final combined = List<Recipe>.from(current.recipes)
            ..addAll(paginated.recipes);
          emit(current.copyWith(
            recipes: combined,
            hasReachedMax: !(paginated.pagination.hasNextPage),
            nextCursor: paginated.pagination.nextCursor,
          ));
        },
      );
    } catch (_) {
      // ignore and keep current
    }
  }
}
