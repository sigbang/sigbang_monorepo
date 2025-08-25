import 'package:equatable/equatable.dart';
import '../../../domain/entities/recipe.dart';

abstract class RecipeCreateState extends Equatable {
  const RecipeCreateState();

  @override
  List<Object?> get props => [];
}

class RecipeCreateInitial extends RecipeCreateState {}

/// 초기에 임시 저장 존재 여부 확인 중 상태 (편집 차단)
// removed draft checking state

class RecipeCreateEditing extends RecipeCreateState {
  final String? draftId;
  final String title;
  final String description;
  final String ingredients;
  final List<RecipeStep> steps;
  final int cookingTime;
  final int servings;
  final RecipeDifficulty difficulty;
  final List<RecipeTag> tags;
  final String? thumbnailPath;
  final String linkName;
  final String linkUrl;
  final bool isDirty;
  final Map<String, String?> errors;

  const RecipeCreateEditing({
    this.draftId,
    this.title = '',
    this.description = '',
    this.ingredients = '',
    this.steps = const [],
    this.cookingTime = 30,
    this.servings = 2,
    this.difficulty = RecipeDifficulty.medium,
    this.tags = const [],
    this.thumbnailPath,
    this.linkName = '',
    this.linkUrl = '',
    this.isDirty = false,
    this.errors = const {},
  });

  RecipeCreateEditing copyWith({
    String? draftId,
    String? title,
    String? description,
    String? ingredients,
    List<RecipeStep>? steps,
    int? cookingTime,
    int? servings,
    RecipeDifficulty? difficulty,
    List<RecipeTag>? tags,
    String? thumbnailPath,
    String? linkName,
    String? linkUrl,
    bool? isDirty,
    Map<String, String?>? errors,
  }) {
    return RecipeCreateEditing(
      draftId: draftId ?? this.draftId,
      title: title ?? this.title,
      description: description ?? this.description,
      ingredients: ingredients ?? this.ingredients,
      steps: steps ?? this.steps,
      cookingTime: cookingTime ?? this.cookingTime,
      servings: servings ?? this.servings,
      difficulty: difficulty ?? this.difficulty,
      tags: tags ?? this.tags,
      thumbnailPath: thumbnailPath ?? this.thumbnailPath,
      linkName: linkName ?? this.linkName,
      linkUrl: linkUrl ?? this.linkUrl,
      isDirty: isDirty ?? this.isDirty,
      errors: errors ?? this.errors,
    );
  }

  bool get isValid {
    // 필수값 최소화: 썸네일만 있으면 발행 버튼 활성화
    return thumbnailPath != null && errors.isEmpty;
  }

  @override
  List<Object?> get props => [
        draftId,
        title,
        description,
        ingredients,
        steps,
        cookingTime,
        servings,
        difficulty,
        tags,
        thumbnailPath,
        linkName,
        linkUrl,
        isDirty,
        errors,
      ];
}

class RecipeCreateUploading extends RecipeCreateEditing {
  final double progress;
  final String currentStep;

  const RecipeCreateUploading({
    required super.title,
    required super.description,
    required super.ingredients,
    required super.steps,
    required super.cookingTime,
    required super.servings,
    required super.difficulty,
    required super.tags,
    required super.linkName,
    required super.linkUrl,
    super.thumbnailPath,
    super.isDirty = true,
    super.errors = const {},
    this.progress = 0.0,
    this.currentStep = '',
  });

  @override
  List<Object?> get props => [...super.props, progress, currentStep];
}

/// 임시 저장 성공 (화면 유지, 스낵바만 표시)
// removed draft state

class RecipeCreateSuccess extends RecipeCreateState {
  final String recipeId;

  const RecipeCreateSuccess({required this.recipeId});

  @override
  List<Object?> get props => [recipeId];
}

class RecipeCreateError extends RecipeCreateState {
  final String message;
  final RecipeCreateEditing? previousState;

  const RecipeCreateError({
    required this.message,
    this.previousState,
  });

  @override
  List<Object?> get props => [message, previousState];
}
