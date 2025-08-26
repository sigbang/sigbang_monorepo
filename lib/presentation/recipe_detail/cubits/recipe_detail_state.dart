import 'package:equatable/equatable.dart';
import '../../../domain/entities/recipe.dart';

abstract class RecipeDetailState extends Equatable {
  const RecipeDetailState();

  @override
  List<Object?> get props => [];
}

class RecipeDetailInitial extends RecipeDetailState {}

class RecipeDetailLoading extends RecipeDetailState {}

class RecipeDetailLoaded extends RecipeDetailState {
  final List<Recipe> recipes;
  final int currentIndex;
  final bool isLoggedIn;
  final String? currentUserId;
  final bool hasReachedStart;
  final bool hasReachedEnd;
  final bool isLoadingPrevious;
  final bool isLoadingNext;

  const RecipeDetailLoaded({
    required this.recipes,
    required this.currentIndex,
    this.isLoggedIn = false,
    this.currentUserId,
    this.hasReachedStart = false,
    this.hasReachedEnd = false,
    this.isLoadingPrevious = false,
    this.isLoadingNext = false,
  });

  Recipe get currentRecipe => recipes[currentIndex];

  RecipeDetailLoaded copyWith({
    List<Recipe>? recipes,
    int? currentIndex,
    bool? isLoggedIn,
    String? currentUserId,
    bool? hasReachedStart,
    bool? hasReachedEnd,
    bool? isLoadingPrevious,
    bool? isLoadingNext,
  }) {
    return RecipeDetailLoaded(
      recipes: recipes ?? this.recipes,
      currentIndex: currentIndex ?? this.currentIndex,
      isLoggedIn: isLoggedIn ?? this.isLoggedIn,
      currentUserId: currentUserId ?? this.currentUserId,
      hasReachedStart: hasReachedStart ?? this.hasReachedStart,
      hasReachedEnd: hasReachedEnd ?? this.hasReachedEnd,
      isLoadingPrevious: isLoadingPrevious ?? this.isLoadingPrevious,
      isLoadingNext: isLoadingNext ?? this.isLoadingNext,
    );
  }

  @override
  List<Object?> get props => [
        recipes,
        currentIndex,
        isLoggedIn,
        currentUserId,
        hasReachedStart,
        hasReachedEnd,
        isLoadingPrevious,
        isLoadingNext,
      ];
}

class RecipeDetailUpdating extends RecipeDetailLoaded {
  const RecipeDetailUpdating({
    required super.recipes,
    required super.currentIndex,
    super.isLoggedIn,
    super.hasReachedStart,
    super.hasReachedEnd,
    super.isLoadingPrevious,
    super.isLoadingNext,
  });
}

class RecipeDetailError extends RecipeDetailState {
  final String message;
  final List<Recipe> recipes;
  final int currentIndex;
  final bool isLoggedIn;

  const RecipeDetailError({
    required this.message,
    this.recipes = const [],
    this.currentIndex = 0,
    this.isLoggedIn = false,
  });

  @override
  List<Object?> get props => [message, recipes, currentIndex, isLoggedIn];
}
