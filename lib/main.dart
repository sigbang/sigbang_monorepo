import 'package:flutter/material.dart';
import 'core/config/env_config.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'domain/repositories/auth_repository.dart';
import 'injection/injection.dart';
import 'src/app.dart';
import 'core/session/session_manager.dart';
import 'presentation/session/session_cubit.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 환경 변수 로드
  await EnvConfig.load();

  // Supabase 초기화 (옵션)
  if (EnvConfig.supabaseUrl.isNotEmpty &&
      EnvConfig.supabaseAnonKey.isNotEmpty) {
    await Supabase.initialize(
      url: EnvConfig.supabaseUrl,
      anonKey: EnvConfig.supabaseAnonKey,
    );
  }

  // 의존성 주입 설정
  await setupDependencyInjection();

  // 인증 초기화
  final authRepository = getIt<AuthRepository>();
  await authRepository.initialize();

  // 세션 매니저 시작 (백그라운드 갱신)
  getIt<SessionManager>().start();

  // 초기 세션 상태 설정
  final isLoggedIn = await authRepository.isLoggedIn();
  if (isLoggedIn) {
    final userResult = await getIt<AuthRepository>().getCurrentUser();
    userResult.fold((_) => getIt<SessionCubit>().setGuest(), (user) {
      if (user != null) {
        getIt<SessionCubit>().setUser(user);
      } else {
        getIt<SessionCubit>().setGuest();
      }
    });
  } else {
    getIt<SessionCubit>().setGuest();
  }

  runApp(const MyApp());
}
