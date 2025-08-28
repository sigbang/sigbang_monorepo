import 'dart:async';
import '../../presentation/session/session_cubit.dart';
import 'session_manager.dart';

class SessionBinding {
  SessionBinding(this._sessionCubit, this._sessionManager) {
    _subscription = _sessionCubit.stream.listen((state) {
      if (state.isLoggedIn) {
        _sessionManager.start();
      } else {
        _sessionManager.stop();
      }
    });
  }

  final SessionCubit _sessionCubit;
  final SessionManager _sessionManager;
  late final StreamSubscription _subscription;

  void dispose() {
    _subscription.cancel();
  }
}
