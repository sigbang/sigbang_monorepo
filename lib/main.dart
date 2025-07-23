import 'package:flutter/material.dart';
import 'injection/injection.dart';
import 'src/app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 의존성 주입 설정
  await setupDependencyInjection();

  runApp(const MyApp());
}
