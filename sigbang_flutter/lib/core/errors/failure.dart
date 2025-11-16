import 'package:equatable/equatable.dart';

abstract class Failure extends Equatable {
  const Failure({this.message = ''});

  final String message;

  @override
  List<Object> get props => [message];
}

class NetworkFailure extends Failure {
  const NetworkFailure({super.message = 'Network error occurred'});
}

class ServerFailure extends Failure {
  const ServerFailure({super.message = 'Server error occurred'});
}

class AuthFailure extends Failure {
  const AuthFailure({super.message = 'Authentication error occurred'});
}

class CacheFailure extends Failure {
  const CacheFailure({super.message = 'Cache error occurred'});
}

class UnknownFailure extends Failure {
  const UnknownFailure({super.message = 'Unknown error occurred'});
}

class NotFoundFailure extends Failure {
  const NotFoundFailure({super.message = 'Resource not found'});
}

class ForbiddenFailure extends Failure {
  const ForbiddenFailure({super.message = 'Access forbidden'});
}
