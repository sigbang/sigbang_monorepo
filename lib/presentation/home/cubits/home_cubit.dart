import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter/foundation.dart';
import '../../../domain/usecases/get_current_user.dart';
import '../../../domain/usecases/get_recommended_recipes.dart';
import 'home_state.dart';

class HomeCubit extends Cubit<HomeState> {
  final GetCurrentUser _getCurrentUser;
  final GetRecommendedRecipes _getRecommendedRecipes;

  HomeCubit(
    this._getCurrentUser,
    this._getRecommendedRecipes,
  ) : super(HomeInitial());

  Future<void> loadHome() async {
    emit(HomeLoading());

    try {
      // 1. 현재 사용자 정보 확인
      final userResult = await _getCurrentUser();
      final user = userResult.fold(
        (failure) {
          if (kDebugMode) {
            print('🏠 No current user: ${failure.message}');
          }
          return null;
        },
        (user) {
          if (kDebugMode) {
            print('🏠 Current user: ${user?.name}');
          }
          return user;
        },
      );

      final isLoggedIn = user != null;

      // 2. 추천 레시피 로드 (로그인 여부에 따라 다른 추천)
      final recipesResult = await _getRecommendedRecipes(user?.id);

      recipesResult.fold(
        (failure) {
          if (kDebugMode) {
            print('❌ Failed to load recommended recipes: ${failure.message}');
          }
          emit(HomeError('추천 레시피를 불러오는데 실패했습니다.'));
        },
        (recipes) {
          if (kDebugMode) {
            print('✅ Loaded ${recipes.length} recommended recipes');
          }
          emit(HomeLoaded(
            user: user,
            recommendedRecipes: recipes,
            isLoggedIn: isLoggedIn,
          ));
        },
      );
    } catch (e) {
      if (kDebugMode) {
        print('❌ Home loading error: $e');
      }
      emit(const HomeError('홈 화면을 불러오는데 실패했습니다.'));
    }
  }

  Future<void> refreshHome() async {
    final currentState = state;
    if (currentState is HomeLoaded) {
      emit(HomeRefreshing(
        user: currentState.user,
        recommendedRecipes: currentState.recommendedRecipes,
        isLoggedIn: currentState.isLoggedIn,
      ));
    }

    await loadHome();
  }
}
