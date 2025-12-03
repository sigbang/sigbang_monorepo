import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_strings.dart';

Future<void> showLoginRequiredDialog(
  BuildContext context, {
  String? title,
  String? message,
}) async {
  final dialogTitle = title ?? '알림';
  final dialogMessage = message ?? AppStrings.loginRequired;

  return showDialog<void>(
    context: context,
    builder: (ctx) {
      return AlertDialog(
        title: Text(dialogTitle),
        content: Text(dialogMessage),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('취소'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              context.push('/login');
            },
            child: const Text('로그인'),
          ),
        ],
      );
    },
  );
}


