import 'package:equatable/equatable.dart';

enum UserStatus { active, suspended, deleted }

class User extends Equatable {
  const User({
    required this.id,
    required this.email,
    required this.name,
    this.avatarUrl,
    required this.status,
  });

  final String id;
  final String email;
  final String name;
  final String? avatarUrl;
  final UserStatus status;

  @override
  List<Object?> get props => [id, email, name, avatarUrl, status];

  User copyWith({
    String? id,
    String? email,
    String? name,
    String? avatarUrl,
    UserStatus? status,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      status: status ?? this.status,
    );
  }
}
