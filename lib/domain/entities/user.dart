import 'package:equatable/equatable.dart';

class User extends Equatable {
  const User({
    required this.id,
    required this.email,
    required this.name,
    this.avatarUrl,
    this.accessToken,
  });

  final String id;
  final String email;
  final String name;
  final String? avatarUrl;
  final String? accessToken;

  @override
  List<Object?> get props => [id, email, name, avatarUrl, accessToken];

  User copyWith({
    String? id,
    String? email,
    String? name,
    String? avatarUrl,
    String? accessToken,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      accessToken: accessToken ?? this.accessToken,
    );
  }
}
