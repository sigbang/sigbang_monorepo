import 'package:flutter/foundation.dart';
import 'package:get_it/get_it.dart';
import 'package:google_sign_in/google_sign_in.dart';

// Data Layer
import '../data/datasources/auth_service_new.dart';
import '../data/datasources/api_client.dart';
import '../data/datasources/recipe_service.dart';
import '../data/repositories/auth_repository_impl.dart';
import '../data/repositories/recipe_repository_impl.dart';

// Domain Layer
import '../domain/repositories/auth_repository.dart';
import '../domain/repositories/recipe_repository.dart';
import '../domain/usecases/login_with_google_token.dart';
import '../domain/usecases/logout.dart';
import '../domain/usecases/logout_all.dart';
import '../domain/usecases/get_current_user.dart';
import '../domain/usecases/initialize_auth.dart';
import '../domain/usecases/get_recipe_feed.dart';
import '../domain/usecases/search_recipes.dart';
import '../domain/usecases/get_recipe_detail.dart';
import '../domain/usecases/create_recipe.dart';
import '../domain/usecases/update_recipe.dart';
import '../domain/usecases/delete_recipe.dart';
import '../domain/usecases/upload_image_with_presign.dart';
import '../domain/usecases/toggle_like.dart';
import '../domain/usecases/toggle_save.dart';
import '../domain/usecases/get_recommended_recipes.dart';
import '../domain/usecases/get_my_recipes.dart';
import '../domain/usecases/get_my_saved_recipes.dart';
// removed draft/image legacy usecases

// Presentation Layer
import '../presentation/login/cubits/login_cubit.dart';
import '../presentation/home/cubits/home_cubit.dart';
import '../presentation/feed/cubits/feed_cubit.dart';
import '../presentation/recipe_detail/cubits/recipe_detail_cubit.dart';
import '../presentation/recipe_create/cubits/recipe_create_cubit.dart';
import '../presentation/profile/cubits/profile_recipes_cubit.dart';
import '../presentation/search/cubits/search_cubit.dart';
import '../core/session/session_manager.dart';
import '../presentation/session/session_cubit.dart';
import '../core/session/session_binding.dart';

final GetIt getIt = GetIt.instance;

Future<void> setupDependencyInjection() async {
  // External dependencies
  getIt.registerLazySingleton<GoogleSignIn>(() => GoogleSignIn(
        scopes: [
          'email',
          'profile',
          'openid',
        ],
        // GCP 프로젝트 설정에서 생성한 웹 어플리케이션 클라이언트 ID
        clientId:
            '185415114151-3o8o60efo73qsvdsbmvidbcat7k0brhb.apps.googleusercontent.com',
      ));

  // API Client (wire token-expired callback to reset session)
  getIt.registerLazySingleton<ApiClient>(() => ApiClient(
        onTokenExpired: () async {
          // Clear any cached state via HomeCubit or other mechanisms if needed
          try {
            // Accessing HomeCubit lazily; ignore if not registered yet
            if (getIt.isRegistered<HomeCubit>()) {
              // Trigger a lightweight reload which will reflect guest state
              await getIt<HomeCubit>().loadHome();
            }
            if (getIt.isRegistered<SessionCubit>()) {
              getIt<SessionCubit>().setGuest();
            }
          } catch (_) {}
        },
      ));

  // Data sources
  getIt.registerLazySingleton<AuthService>(() => AuthService(
        apiClient: getIt<ApiClient>(),
        googleSignIn: getIt<GoogleSignIn>(),
        onTokenExpired: () async {
          if (kDebugMode) {
            print('🔄 Auth service token expired');
          }
          try {
            if (getIt.isRegistered<HomeCubit>()) {
              await getIt<HomeCubit>().loadHome();
            }
            if (getIt.isRegistered<SessionCubit>()) {
              getIt<SessionCubit>().setGuest();
            }
          } catch (_) {}
        },
      ));

  getIt.registerLazySingleton<RecipeService>(
      () => RecipeService(getIt<ApiClient>()));

  // Repositories
  getIt.registerLazySingleton<AuthRepository>(
      () => AuthRepositoryImpl(getIt<AuthService>()));
  getIt.registerLazySingleton<RecipeRepository>(
      () => RecipeRepositoryImpl(getIt<RecipeService>()));

  // Auth Use cases
  getIt.registerLazySingleton<InitializeAuth>(
      () => InitializeAuth(getIt<AuthRepository>()));
  getIt.registerLazySingleton<LoginWithGoogleToken>(
      () => LoginWithGoogleToken(getIt<AuthRepository>()));
  getIt.registerLazySingleton<Logout>(() => Logout(getIt<AuthRepository>()));
  getIt.registerLazySingleton<LogoutAll>(
      () => LogoutAll(getIt<AuthRepository>()));
  getIt.registerLazySingleton<GetCurrentUser>(
      () => GetCurrentUser(getIt<AuthRepository>()));

  // Recipe Use cases
  getIt.registerLazySingleton<GetRecipeFeed>(
      () => GetRecipeFeed(getIt<RecipeRepository>()));
  getIt.registerLazySingleton<SearchRecipes>(
      () => SearchRecipes(getIt<RecipeRepository>()));
  getIt.registerLazySingleton<GetRecipeDetail>(
      () => GetRecipeDetail(getIt<RecipeRepository>()));
  getIt.registerLazySingleton<CreateRecipe>(
      () => CreateRecipe(getIt<RecipeRepository>()));
  getIt.registerLazySingleton<UpdateRecipe>(
      () => UpdateRecipe(getIt<RecipeRepository>()));
  getIt.registerLazySingleton<DeleteRecipe>(
      () => DeleteRecipe(getIt<RecipeRepository>()));
  getIt.registerLazySingleton<UploadImageWithPresign>(
      () => UploadImageWithPresign(getIt<RecipeRepository>()));
  getIt.registerLazySingleton<GetRecommendedRecipes>(
      () => GetRecommendedRecipes(getIt<RecipeRepository>()));
  getIt.registerLazySingleton<GetPopularRecipes>(
      () => GetPopularRecipes(getIt<RecipeRepository>()));
  getIt.registerLazySingleton<GetRecommendedFeedUsecase>(
      () => GetRecommendedFeedUsecase(getIt<RecipeRepository>()));
  getIt.registerLazySingleton<GetMyRecipes>(
      () => GetMyRecipes(getIt<RecipeRepository>()));
  getIt.registerLazySingleton<GetMySavedRecipes>(
      () => GetMySavedRecipes(getIt<RecipeRepository>()));
  getIt.registerLazySingleton<ToggleLike>(
      () => ToggleLike(getIt<RecipeRepository>()));
  getIt.registerLazySingleton<ToggleSave>(
      () => ToggleSave(getIt<RecipeRepository>()));
  // removed draft/image legacy registrations

  // Cubits (as factories to create new instances each time)
  getIt.registerFactory<LoginCubit>(() => LoginCubit(
        loginWithGoogleToken: getIt<LoginWithGoogleToken>(),
        logout: getIt<Logout>(),
      ));
  // HomeCubit is a singleton to drive app-wide session/UI state
  getIt.registerLazySingleton<HomeCubit>(() => HomeCubit(
        getIt<GetCurrentUser>(),
        getIt<GetRecommendedRecipes>(),
        getIt<GetPopularRecipes>(),
      ));
  getIt.registerFactory<FeedCubit>(() => FeedCubit(
        getIt<GetRecipeFeed>(),
        getIt<GetCurrentUser>(),
      ));
  getIt.registerFactory<RecipeDetailCubit>(() => RecipeDetailCubit(
        getIt<GetRecipeDetail>(),
        getIt<GetRecipeFeed>(),
        getIt<GetCurrentUser>(),
        getIt<DeleteRecipe>(),
        getIt<ToggleLike>(),
        getIt<ToggleSave>(),
      ));
  getIt.registerFactory<RecipeCreateCubit>(() => RecipeCreateCubit(
        getIt<CreateRecipe>(),
        getIt<UpdateRecipe>(),
        getIt<UploadImageWithPresign>(),
      ));
  getIt.registerFactory<ProfileRecipesCubit>(() => ProfileRecipesCubit(
        getIt<GetMyRecipes>(),
        getIt<GetMySavedRecipes>(),
      ));
  getIt.registerFactory<SearchCubit>(() => SearchCubit(
        getIt<SearchRecipes>(),
      ));

  // Session support
  getIt.registerLazySingleton<SessionCubit>(() => SessionCubit());
  getIt.registerLazySingleton<SessionManager>(
      () => SessionManager(getIt<ApiClient>()));
  getIt.registerLazySingleton<SessionBinding>(
      () => SessionBinding(getIt<SessionCubit>(), getIt<SessionManager>()));
}
