import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter/foundation.dart';
import '../../../domain/entities/recipe.dart';
import '../../../domain/usecases/get_my_recipes.dart';
import '../../../domain/usecases/get_my_saved_recipes.dart';
import 'profile_recipes_state.dart';

class ProfileRecipesCubit extends Cubit<ProfileRecipesState> {
  final GetMyRecipes _getMyRecipes;
  final GetMySavedRecipes _getMySavedRecipes;

  ProfileRecipesCubit(this._getMyRecipes, this._getMySavedRecipes)
      : super(const ProfileRecipesState());

  static const int _pageSize = 10;

  Future<void> loadInitial() async {
    if (state.isLoading) return;
    emit(state.copyWith(isLoading: true, errorMessage: null));
    try {
      final results = await Future.wait([
        _getMyRecipes(limit: _pageSize),
        _getMySavedRecipes(limit: _pageSize),
      ]);

      final myRes = results[0];
      final savedRes = results[1];

      myRes.fold((f) {
        emit(state.copyWith(
            isLoading: false, errorMessage: '내 레시피를 불러오지 못했습니다'));
      }, (p) {
        emit(state.copyWith(
          myRecipes: p.recipes,
          myNextCursor: p.pagination.nextCursor,
        ));
      });

      savedRes.fold((f) {
        emit(state.copyWith(isLoading: false, errorMessage: '북마크를 불러오지 못했습니다'));
      }, (p) {
        emit(state.copyWith(
          isLoading: false,
          savedRecipes: p.recipes,
          savedNextCursor: p.pagination.nextCursor,
        ));
      });
    } catch (e) {
      if (kDebugMode) {
        print('❌ Profile load error: $e');
      }
      emit(state.copyWith(isLoading: false, errorMessage: '오류가 발생했습니다'));
    }
  }

  Future<void> loadMoreMyRecipes() async {
    if (state.isLoadingMoreMy || state.myNextCursor == null) return;
    emit(state.copyWith(isLoadingMoreMy: true));

    final res =
        await _getMyRecipes(limit: _pageSize, cursor: state.myNextCursor);
    res.fold((f) {
      emit(state.copyWith(isLoadingMoreMy: false));
    }, (p) {
      final merged = List<Recipe>.from(state.myRecipes)..addAll(p.recipes);
      emit(state.copyWith(
        isLoadingMoreMy: false,
        myRecipes: merged,
        myNextCursor: p.pagination.nextCursor,
      ));
    });
  }

  Future<void> loadMoreSavedRecipes() async {
    if (state.isLoadingMoreSaved || state.savedNextCursor == null) return;
    emit(state.copyWith(isLoadingMoreSaved: true));

    final res = await _getMySavedRecipes(
        limit: _pageSize, cursor: state.savedNextCursor);
    res.fold((f) {
      emit(state.copyWith(isLoadingMoreSaved: false));
    }, (p) {
      final merged = List<Recipe>.from(state.savedRecipes)..addAll(p.recipes);
      emit(state.copyWith(
        isLoadingMoreSaved: false,
        savedRecipes: merged,
        savedNextCursor: p.pagination.nextCursor,
      ));
    });
  }
}
