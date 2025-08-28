import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/user.dart';

class SessionState {
  const SessionState({required this.isLoggedIn, this.user});
  final bool isLoggedIn;
  final User? user;
}

class SessionCubit extends Cubit<SessionState> {
  SessionCubit() : super(const SessionState(isLoggedIn: false));

  void setGuest() => emit(const SessionState(isLoggedIn: false));
  void setUser(User user) => emit(SessionState(isLoggedIn: true, user: user));
}
