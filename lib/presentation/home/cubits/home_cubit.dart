import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../domain/usecases/get_current_user.dart';
import 'home_state.dart';

class HomeCubit extends Cubit<HomeState> {
  HomeCubit({
    required GetCurrentUser getCurrentUser,
  })  : _getCurrentUser = getCurrentUser,
        super(const HomeInitial());

  final GetCurrentUser _getCurrentUser;

  Future<void> loadUserInfo() async {
    emit(const HomeLoading());

    final result = await _getCurrentUser();
    
    result.fold(
      (failure) => emit(HomeError(failure.message)),
      (user) {
        if (user != null) {
          emit(HomeLoaded(user));
        } else {
          emit(const HomeError('사용자 정보를 찾을 수 없습니다'));
        }
      },
    );
  }
} 