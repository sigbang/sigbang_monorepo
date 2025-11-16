import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../session/session_cubit.dart';
import '../../../domain/entities/user.dart' show UserStatus;

class SuspendedBanner extends StatelessWidget {
  const SuspendedBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocSelector<SessionCubit, SessionState, bool>(
      selector: (state) => state.user?.status == UserStatus.suspended,
      builder: (context, isSuspended) {
        if (!isSuspended) return const SizedBox.shrink();

        return Container(
          width: double.infinity,
          color: Colors.amber.withOpacity(0.2),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              Icon(
                Icons.warning_amber_rounded,
                color: Theme.of(context).colorScheme.error,
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '계정이 일시 정지되었습니다. 일부 기능을 사용할 수 없습니다.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
