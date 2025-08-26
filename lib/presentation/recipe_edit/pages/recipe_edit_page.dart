import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../recipe_create/cubits/recipe_create_cubit.dart';
import '../../recipe_create/cubits/recipe_create_state.dart';
import '../../recipe_create/pages/recipe_create_page.dart'
    show RecipeCreateView;
import '../../../domain/usecases/get_recipe_detail.dart';
import '../../../injection/injection.dart';

class RecipeEditPage extends StatelessWidget {
  final String recipeId;

  const RecipeEditPage({super.key, required this.recipeId});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => getIt<RecipeCreateCubit>()..startEditing(),
      child: _RecipeEditScaffold(recipeId: recipeId),
    );
  }
}

class _RecipeEditScaffold extends StatefulWidget {
  final String recipeId;
  const _RecipeEditScaffold({required this.recipeId});

  @override
  State<_RecipeEditScaffold> createState() => _RecipeEditScaffoldState();
}

class _RecipeEditScaffoldState extends State<_RecipeEditScaffold> {
  @override
  void initState() {
    super.initState();
    // Load recipe detail and prefill the create cubit
    final getDetail = getIt<GetRecipeDetail>();
    Future.microtask(() async {
      final result = await getDetail(widget.recipeId, 'current_user_id');
      result.fold(
        (_) {},
        (recipe) {
          if (!mounted) return;
          context.read<RecipeCreateCubit>().startEditingFromRecipe(recipe);
        },
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<RecipeCreateCubit, RecipeCreateState>(
      builder: (context, state) {
        // Reuse the create view UI for editing
        return const RecipeCreateView();
      },
    );
  }
}
