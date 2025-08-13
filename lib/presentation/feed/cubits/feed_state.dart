import 'package:equatable/equatable.dart';
import '../../../domain/entities/recipe.dart';

abstract class FeedState extends Equatable {
  const FeedState();

  @override
  List<Object?> get props => [];
}

class FeedInitial extends FeedState {}

class FeedLoading extends FeedState {}

class FeedLoaded extends FeedState {
  final List<Recipe> recipes;
  final bool hasReachedMax;
  final bool isLoggedIn;
  final String? searchQuery;
  final List<String> selectedTags;
  final String? nextCursor;
  final DateTime? since;
  final int? newCount;

  const FeedLoaded({
    required this.recipes,
    this.hasReachedMax = false,
    this.isLoggedIn = false,
    this.searchQuery,
    this.selectedTags = const [],
    this.nextCursor,
    this.since,
    this.newCount,
  });

  FeedLoaded copyWith({
    List<Recipe>? recipes,
    bool? hasReachedMax,
    bool? isLoggedIn,
    String? searchQuery,
    List<String>? selectedTags,
    String? nextCursor,
    DateTime? since,
    int? newCount,
  }) {
    return FeedLoaded(
      recipes: recipes ?? this.recipes,
      hasReachedMax: hasReachedMax ?? this.hasReachedMax,
      isLoggedIn: isLoggedIn ?? this.isLoggedIn,
      searchQuery: searchQuery ?? this.searchQuery,
      selectedTags: selectedTags ?? this.selectedTags,
      nextCursor: nextCursor ?? this.nextCursor,
      since: since ?? this.since,
      newCount: newCount ?? this.newCount,
    );
  }

  @override
  List<Object?> get props => [
        recipes,
        hasReachedMax,
        isLoggedIn,
        searchQuery,
        selectedTags,
        nextCursor,
        since,
        newCount,
      ];
}

class FeedLoadingMore extends FeedLoaded {
  const FeedLoadingMore({
    required super.recipes,
    super.hasReachedMax,
    super.isLoggedIn,
    super.searchQuery,
    super.selectedTags,
    super.nextCursor,
    super.since,
    super.newCount,
  });
}

class FeedRefreshing extends FeedLoaded {
  const FeedRefreshing({
    required super.recipes,
    super.hasReachedMax,
    super.isLoggedIn,
    super.searchQuery,
    super.selectedTags,
    super.nextCursor,
    super.since,
    super.newCount,
  });
}

class FeedError extends FeedState {
  final String message;
  final List<Recipe> recipes;
  final bool isLoggedIn;

  const FeedError({
    required this.message,
    this.recipes = const [],
    this.isLoggedIn = false,
  });

  @override
  List<Object?> get props => [message, recipes, isLoggedIn];
}
