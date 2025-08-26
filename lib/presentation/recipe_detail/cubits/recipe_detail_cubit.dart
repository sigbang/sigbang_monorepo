import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter/foundation.dart';
import '../../../domain/entities/recipe.dart';
import '../../../domain/entities/recipe_query.dart';
import '../../../domain/usecases/get_recipe_detail.dart';
import '../../../domain/usecases/get_recipe_feed.dart';
import '../../../domain/usecases/get_current_user.dart';
import 'recipe_detail_state.dart';

class RecipeDetailCubit extends Cubit<RecipeDetailState> {
  final GetRecipeDetail _getRecipeDetail;
  final GetRecipeFeed _getRecipeFeed;
  final GetCurrentUser _getCurrentUser;

  RecipeDetailCubit(
    this._getRecipeDetail,
    this._getRecipeFeed,
    this._getCurrentUser,
  ) : super(RecipeDetailInitial());

  static const int _pageSize = 10;
  String? _currentFeedQuery;
  List<String> _currentTags = [];

  /// 레시피 상세 화면 초기 로드
  /// [recipeId] 보려는 레시피 ID
  /// [feedQuery] 피드에서 온 경우의 검색어
  /// [tags] 피드에서 온 경우의 태그 필터
  Future<void> loadRecipeDetail(
    String recipeId, {
    String? feedQuery,
    List<String> tags = const [],
  }) async {
    if (state is RecipeDetailLoading) return;

    emit(RecipeDetailLoading());

    try {
      // 1. 현재 사용자 확인
      final userResult = await _getCurrentUser();
      String? currentUserId;
      final isLoggedIn = userResult.fold(
        (failure) => false,
        (user) {
          currentUserId = user?.id;
          return user != null;
        },
      );

      // 2. 피드 검색 조건 저장
      _currentFeedQuery = feedQuery;
      _currentTags = tags;

      if (kDebugMode) {
        print('📖 Loading recipe detail: $recipeId');
        print('🔍 Feed query: $feedQuery');
        print('🏷️ Tags: $tags');
        print('👤 Logged in: $isLoggedIn');
      }

      // 3. 현재 레시피 상세 정보 로드
      final detailResult = await _getRecipeDetail(
          recipeId, isLoggedIn ? 'current_user_id' : null);

      await detailResult.fold(
        (failure) async {
          if (kDebugMode) {
            print('❌ Recipe detail load failed: ${failure.toString()}');
          }
          emit(RecipeDetailError(
            message: '레시피를 불러오는데 실패했습니다',
            isLoggedIn: isLoggedIn,
          ));
        },
        (recipe) async {
          // 4. 피드에서 온 경우, 주변 레시피들도 로드
          if (feedQuery != null || tags.isNotEmpty) {
            await _loadSurroundingRecipesFromFeed(
                recipe, isLoggedIn, currentUserId);
          } else {
            // 5. 일반적인 경우, 관련 레시피들 로드
            await _loadSurroundingRecipesByRecommendation(
                recipe, isLoggedIn, currentUserId);
          }
        },
      );
    } catch (e) {
      if (kDebugMode) {
        print('❌ Recipe detail error: $e');
      }
      emit(RecipeDetailError(
        message: '예기치 못한 오류가 발생했습니다',
        isLoggedIn: false,
      ));
    }
  }

  /// 피드에서 온 경우 주변 레시피들 로드
  Future<void> _loadSurroundingRecipesFromFeed(
      Recipe targetRecipe, bool isLoggedIn, String? currentUserId) async {
    try {
      final query = RecipeQuery(
        limit: _pageSize,
        search: _currentFeedQuery,
        tag: _currentTags.isNotEmpty ? _currentTags.first : null,
      );

      final feedResult =
          await _getRecipeFeed(query, isLoggedIn ? 'current_user_id' : null);

      feedResult.fold(
        (failure) {
          // 피드 로드 실패 시 현재 레시피만 표시
          emit(RecipeDetailLoaded(
            recipes: [targetRecipe],
            currentIndex: 0,
            isLoggedIn: isLoggedIn,
            currentUserId: currentUserId,
            hasReachedStart: true,
            hasReachedEnd: true,
          ));
        },
        (paginatedRecipes) {
          final recipes = paginatedRecipes.recipes;

          // 현재 레시피의 인덱스 찾기
          int currentIndex = recipes.indexWhere((r) => r.id == targetRecipe.id);

          if (currentIndex == -1) {
            // 피드에 현재 레시피가 없는 경우, 첫 번째에 추가
            recipes.insert(0, targetRecipe);
            currentIndex = 0;
          }

          if (kDebugMode) {
            print('📄 Loaded ${recipes.length} recipes from feed');
            print('📍 Current recipe index: $currentIndex');
          }

          emit(RecipeDetailLoaded(
            recipes: recipes,
            currentIndex: currentIndex,
            isLoggedIn: isLoggedIn,
            currentUserId: currentUserId,
            hasReachedStart: currentIndex == 0,
            hasReachedEnd: currentIndex == recipes.length - 1 &&
                paginatedRecipes.recipes.length < _pageSize,
          ));
        },
      );
    } catch (e) {
      // 에러 시 현재 레시피만 표시
      emit(RecipeDetailLoaded(
        recipes: [targetRecipe],
        currentIndex: 0,
        isLoggedIn: isLoggedIn,
        currentUserId: currentUserId,
        hasReachedStart: true,
        hasReachedEnd: true,
      ));
    }
  }

  /// 추천 기반으로 주변 레시피들 로드
  Future<void> _loadSurroundingRecipesByRecommendation(
      Recipe targetRecipe, bool isLoggedIn, String? currentUserId) async {
    try {
      // 현재 레시피의 태그를 기반으로 유사한 레시피들 로드
      final tags = targetRecipe.tags.map((tag) => tag.name).toList();

      final query = RecipeQuery(
        limit: _pageSize,
        tag: tags.isNotEmpty ? tags.first : null,
      );

      final recommendationResult =
          await _getRecipeFeed(query, isLoggedIn ? 'current_user_id' : null);

      recommendationResult.fold(
        (failure) {
          // 추천 로드 실패 시 현재 레시피만 표시
          emit(RecipeDetailLoaded(
            recipes: [targetRecipe],
            currentIndex: 0,
            isLoggedIn: isLoggedIn,
            currentUserId: currentUserId,
            hasReachedStart: true,
            hasReachedEnd: true,
          ));
        },
        (paginatedRecipes) {
          final recipes = paginatedRecipes.recipes;

          // 현재 레시피를 첫 번째에 배치
          recipes.removeWhere((r) => r.id == targetRecipe.id);
          recipes.insert(0, targetRecipe);

          if (kDebugMode) {
            print('🎯 Loaded ${recipes.length} recommended recipes');
          }

          emit(RecipeDetailLoaded(
            recipes: recipes,
            currentIndex: 0,
            isLoggedIn: isLoggedIn,
            currentUserId: currentUserId,
            hasReachedStart: true,
            hasReachedEnd: paginatedRecipes.recipes.length < _pageSize,
          ));
        },
      );
    } catch (e) {
      // 에러 시 현재 레시피만 표시
      emit(RecipeDetailLoaded(
        recipes: [targetRecipe],
        currentIndex: 0,
        isLoggedIn: isLoggedIn,
        currentUserId: currentUserId,
        hasReachedStart: true,
        hasReachedEnd: true,
      ));
    }
  }

  /// 페이지 변경 (스와이프)
  void onPageChanged(int newIndex) {
    final currentState = state;
    if (currentState is! RecipeDetailLoaded) return;

    if (kDebugMode) {
      print('📄 Page changed to: $newIndex/${currentState.recipes.length - 1}');
    }

    emit(currentState.copyWith(currentIndex: newIndex));

    // 마지막 페이지 근처에서 더 많은 레시피 로드
    if (newIndex >= currentState.recipes.length - 2 &&
        !currentState.hasReachedEnd) {
      _loadMoreRecipes();
    }
  }

  /// 더 많은 레시피 로드 (무한 스크롤)
  Future<void> _loadMoreRecipes() async {
    final currentState = state;
    if (currentState is! RecipeDetailLoaded ||
        currentState.hasReachedEnd ||
        currentState.isLoadingNext) {
      return;
    }

    emit(currentState.copyWith(isLoadingNext: true));

    try {
      final query = RecipeQuery(
        limit: _pageSize,
        search: _currentFeedQuery,
        tag: _currentTags.isNotEmpty ? _currentTags.first : null,
      );

      final result = await _getRecipeFeed(
          query, currentState.isLoggedIn ? 'current_user_id' : null);

      result.fold(
        (failure) {
          if (kDebugMode) {
            print('❌ Load more recipes failed: ${failure.toString()}');
          }
          emit(currentState.copyWith(isLoadingNext: false));
        },
        (paginatedRecipes) {
          final newRecipes = List<Recipe>.from(currentState.recipes)
            ..addAll(paginatedRecipes.recipes);

          if (kDebugMode) {
            print('📄 Loaded ${paginatedRecipes.recipes.length} more recipes');
          }

          emit(currentState.copyWith(
            recipes: newRecipes,
            hasReachedEnd: paginatedRecipes.recipes.length < _pageSize,
            isLoadingNext: false,
          ));
        },
      );
    } catch (e) {
      if (kDebugMode) {
        print('❌ Load more recipes error: $e');
      }
      emit(currentState.copyWith(isLoadingNext: false));
    }
  }

  /// 좋아요 토글
  Future<void> toggleLike() async {
    final currentState = state;
    if (currentState is! RecipeDetailLoaded || !currentState.isLoggedIn) return;

    final currentRecipe = currentState.currentRecipe;

    // 낙관적 업데이트
    final updatedRecipe = currentRecipe.copyWith(
      isLiked: !currentRecipe.isLiked,
      likesCount: currentRecipe.isLiked
          ? currentRecipe.likesCount - 1
          : currentRecipe.likesCount + 1,
    );

    final updatedRecipes = List<Recipe>.from(currentState.recipes);
    updatedRecipes[currentState.currentIndex] = updatedRecipe;

    emit(currentState.copyWith(recipes: updatedRecipes));

    if (kDebugMode) {
      print('❤️ Toggled like for recipe: ${currentRecipe.title}');
    }

    // TODO: 실제 API 호출 구현
    try {
      // await _toggleRecipeLike(currentRecipe.id);
    } catch (e) {
      // 실패 시 원래 상태로 복원
      emit(currentState.copyWith(recipes: currentState.recipes));
      if (kDebugMode) {
        print('❌ Like toggle failed: $e');
      }
    }
  }

  /// 저장 토글
  Future<void> toggleSave() async {
    final currentState = state;
    if (currentState is! RecipeDetailLoaded || !currentState.isLoggedIn) return;

    final currentRecipe = currentState.currentRecipe;

    // 낙관적 업데이트
    final updatedRecipe = currentRecipe.copyWith(
      isSaved: !currentRecipe.isSaved,
    );

    final updatedRecipes = List<Recipe>.from(currentState.recipes);
    updatedRecipes[currentState.currentIndex] = updatedRecipe;

    emit(currentState.copyWith(recipes: updatedRecipes));

    if (kDebugMode) {
      print('🔖 Toggled save for recipe: ${currentRecipe.title}');
    }

    // TODO: 실제 API 호출 구현
    try {
      // await _toggleRecipeSave(currentRecipe.id);
    } catch (e) {
      // 실패 시 원래 상태로 복원
      emit(currentState.copyWith(recipes: currentState.recipes));
      if (kDebugMode) {
        print('❌ Save toggle failed: $e');
      }
    }
  }

  /// 뷰카운트 증가
  Future<void> incrementViewCount() async {
    final currentState = state;
    if (currentState is! RecipeDetailLoaded) return;

    final currentRecipe = currentState.currentRecipe;

    // 뷰카운트 업데이트
    final updatedRecipe = currentRecipe.copyWith(
      viewCount: currentRecipe.viewCount + 1,
    );

    final updatedRecipes = List<Recipe>.from(currentState.recipes);
    updatedRecipes[currentState.currentIndex] = updatedRecipe;

    emit(currentState.copyWith(recipes: updatedRecipes));

    if (kDebugMode) {
      print('👁️ Incremented view count for recipe: ${currentRecipe.title}');
    }

    // TODO: 실제 API 호출 구현
    try {
      // await _incrementRecipeViewCount(currentRecipe.id);
    } catch (e) {
      if (kDebugMode) {
        print('❌ View count increment failed: $e');
      }
    }
  }
}
