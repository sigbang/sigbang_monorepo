import 'package:equatable/equatable.dart';
import '../../../domain/entities/recipe.dart';

abstract class SearchState extends Equatable {
  const SearchState();

  @override
  List<Object?> get props => [];
}

class SearchInitial extends SearchState {}

class SearchIdle extends SearchState {
  const SearchIdle();
}

class SearchLoading extends SearchState {}

class SearchError extends SearchState {
  final String message;
  const SearchError(this.message);

  @override
  List<Object?> get props => [message];
}

class SearchLoaded extends SearchState {
  final List<Recipe> recipes;
  final bool hasReachedMax;
  final String? nextCursor;
  final String query;

  const SearchLoaded({
    required this.recipes,
    required this.hasReachedMax,
    required this.query,
    this.nextCursor,
  });

  SearchLoaded copyWith({
    List<Recipe>? recipes,
    bool? hasReachedMax,
    String? nextCursor,
    String? query,
  }) {
    return SearchLoaded(
      recipes: recipes ?? this.recipes,
      hasReachedMax: hasReachedMax ?? this.hasReachedMax,
      query: query ?? this.query,
      nextCursor: nextCursor ?? this.nextCursor,
    );
  }

  @override
  List<Object?> get props => [recipes, hasReachedMax, nextCursor, query];
}
