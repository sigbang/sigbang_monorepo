import '../../domain/entities/user.dart';

class UserModel extends User {
  const UserModel({
    required super.id,
    required super.email,
    required super.name,
    super.avatarUrl,
    required super.status,
  });

  static UserStatus _parseStatus(dynamic value) {
    if (value == null) return UserStatus.active;
    final s = value.toString().toLowerCase();
    switch (s) {
      case 'active':
        return UserStatus.active;
      case 'suspended':
        return UserStatus.suspended;
      case 'deleted':
        return UserStatus.deleted;
      default:
        return UserStatus.active;
    }
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String,
      name: (json['nickname'] ?? json['name']) as String,
      avatarUrl: json['profileImage'] ?? json['avatar_url'] as String?,
      status: _parseStatus(json['status']),
    );
  }

  Map<String, dynamic> toJson() {
    String statusString;
    switch (status) {
      case UserStatus.active:
        statusString = 'ACTIVE';
        break;
      case UserStatus.suspended:
        statusString = 'SUSPENDED';
        break;
      case UserStatus.deleted:
        statusString = 'DELETED';
        break;
    }
    return {
      'id': id,
      'email': email,
      'name': name,
      'avatar_url': avatarUrl,
      'status': statusString,
    };
  }

  factory UserModel.fromDomain(User user) {
    return UserModel(
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      status: user.status,
    );
  }

  User toDomain() {
    return User(
      id: id,
      email: email,
      name: name,
      avatarUrl: avatarUrl,
      status: status,
    );
  }
}
