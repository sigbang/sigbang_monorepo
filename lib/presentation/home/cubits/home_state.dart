import 'package:equatable/equatable.dart';
import '../../../domain/entities/recipe.dart';
import '../../../domain/entities/user.dart';

abstract class HomeState extends Equatable {
  const HomeState();

  @override
  List<Object?> get props => [];
}

class HomeInitial extends HomeState {}

class HomeLoading extends HomeState {}

class HomeLoaded extends HomeState {
  final User? user;
  final List<Recipe> recommendedRecipes;
  final bool isLoggedIn;

  const HomeLoaded({
    this.user,
    required this.recommendedRecipes,
    required this.isLoggedIn,
  });

  @override
  List<Object?> get props => [user, recommendedRecipes, isLoggedIn];
}

class HomeError extends HomeState {
  final String message;

  const HomeError(this.message);

  @override
  List<Object?> get props => [message];
}

class HomeRefreshing extends HomeState {
  final User? user;
  final List<Recipe> recommendedRecipes;
  final bool isLoggedIn;

  const HomeRefreshing({
    this.user,
    required this.recommendedRecipes,
    required this.isLoggedIn,
  });

  @override
  List<Object?> get props => [user, recommendedRecipes, isLoggedIn];
}
