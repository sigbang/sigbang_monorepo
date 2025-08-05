import 'package:flutter/material.dart';
import 'core/config/env_config.dart';
import 'domain/repositories/auth_repository.dart';
import 'injection/injection.dart';
import 'src/app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 환경 변수 로드
  await EnvConfig.load();

  // 의존성 주입 설정
  await setupDependencyInjection();

  // 인증 초기화
  final authRepository = getIt<AuthRepository>();
  await authRepository.initialize();

  runApp(const MyApp());
}
