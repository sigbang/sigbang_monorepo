import 'package:flutter/foundation.dart';
import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import 'package:google_sign_in/google_sign_in.dart';

// Data Layer
import '../data/datasources/auth_service.dart';
import '../data/repositories/auth_repository_impl.dart';

// Domain Layer
import '../domain/repositories/auth_repository.dart';
import '../domain/usecases/login_with_google_token.dart';
import '../domain/usecases/logout.dart';
import '../domain/usecases/get_current_user.dart';

// Presentation Layer
import '../presentation/login/cubits/login_cubit.dart';
import '../presentation/home/cubits/home_cubit.dart';

final GetIt getIt = GetIt.instance;

Future<void> setupDependencyInjection() async {
  // External dependencies
  getIt.registerLazySingleton<Dio>(() {
    final dio = Dio();

    // 타임아웃 설정
    dio.options.connectTimeout = const Duration(seconds: 30);
    dio.options.receiveTimeout = const Duration(seconds: 30);

    // 로그 인터셉터 (개발 환경에서만)
    if (kDebugMode) {
      dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
        error: true,
      ));
    }

    return dio;
  });
  getIt.registerLazySingleton<GoogleSignIn>(() => GoogleSignIn(
        scopes: [
          'email',
          'https://www.googleapis.com/auth/userinfo.profile',
          'openid',
        ],
        // GCP 프로젝트 설정에서 생성한 웹 어플리케이션 클라이언트 ID
        clientId:
            '185415114151-3o8o60efo73qsvdsbmvidbcat7k0brhb.apps.googleusercontent.com',
      ));

  // Data sources
  getIt.registerLazySingleton<AuthService>(
    () => AuthService(
      dio: getIt<Dio>(),
      googleSignIn: getIt<GoogleSignIn>(),
    ),
  );

  // Repositories
  getIt.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(getIt<AuthService>()),
  );

  // Use cases
  getIt.registerLazySingleton<LoginWithGoogleToken>(
    () => LoginWithGoogleToken(getIt<AuthRepository>()),
  );
  getIt.registerLazySingleton<Logout>(
    () => Logout(getIt<AuthRepository>()),
  );
  getIt.registerLazySingleton<GetCurrentUser>(
    () => GetCurrentUser(getIt<AuthRepository>()),
  );

  // Cubits (as factories to create new instances each time)
  getIt.registerFactory<LoginCubit>(
    () => LoginCubit(
      loginWithGoogleToken: getIt<LoginWithGoogleToken>(),
      logout: getIt<Logout>(),
    ),
  );
  getIt.registerFactory<HomeCubit>(
    () => HomeCubit(
      getCurrentUser: getIt<GetCurrentUser>(),
    ),
  );
}
