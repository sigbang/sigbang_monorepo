import 'package:equatable/equatable.dart';
import '../../../domain/entities/recipe.dart';

class ProfileRecipesState extends Equatable {
  final bool isLoading;
  final String? errorMessage;

  final List<Recipe> myRecipes;
  final String? myNextCursor;
  final bool isLoadingMoreMy;

  final List<Recipe> savedRecipes;
  final String? savedNextCursor;
  final bool isLoadingMoreSaved;

  const ProfileRecipesState({
    this.isLoading = false,
    this.errorMessage,
    this.myRecipes = const [],
    this.myNextCursor,
    this.isLoadingMoreMy = false,
    this.savedRecipes = const [],
    this.savedNextCursor,
    this.isLoadingMoreSaved = false,
  });

  ProfileRecipesState copyWith({
    bool? isLoading,
    String? errorMessage,
    List<Recipe>? myRecipes,
    String? myNextCursor,
    bool? isLoadingMoreMy,
    List<Recipe>? savedRecipes,
    String? savedNextCursor,
    bool? isLoadingMoreSaved,
  }) {
    return ProfileRecipesState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      myRecipes: myRecipes ?? this.myRecipes,
      myNextCursor: myNextCursor ?? this.myNextCursor,
      isLoadingMoreMy: isLoadingMoreMy ?? this.isLoadingMoreMy,
      savedRecipes: savedRecipes ?? this.savedRecipes,
      savedNextCursor: savedNextCursor ?? this.savedNextCursor,
      isLoadingMoreSaved: isLoadingMoreSaved ?? this.isLoadingMoreSaved,
    );
  }

  @override
  List<Object?> get props => [
        isLoading,
        errorMessage,
        myRecipes,
        myNextCursor,
        isLoadingMoreMy,
        savedRecipes,
        savedNextCursor,
        isLoadingMoreSaved,
      ];
}
