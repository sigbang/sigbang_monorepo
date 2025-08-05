import 'user_model.dart';
import 'auth_tokens_model.dart';

class LoginResponseModel {
  const LoginResponseModel({
    required this.user,
    required this.tokens,
  });

  final UserModel user;
  final AuthTokensModel tokens;

  factory LoginResponseModel.fromJson(Map<String, dynamic> json) {
    return LoginResponseModel(
      user: UserModel.fromJson(json['user'] ?? json),
      tokens: AuthTokensModel.fromJson(json),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user': user.toJson(),
      ...tokens.toJson(),
    };
  }
}
