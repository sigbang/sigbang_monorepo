import '../../domain/entities/auth_tokens.dart';

class AuthTokensModel extends AuthTokens {
  const AuthTokensModel({
    required super.accessToken,
    required super.refreshToken,
    super.expiresIn,
  });

  factory AuthTokensModel.fromJson(Map<String, dynamic> json) {
    final tokens = json['tokens'] as Map<String, dynamic>?;
    return AuthTokensModel(
      accessToken: (json['accessToken'] ?? tokens?['accessToken']) as String,
      refreshToken: (json['refreshToken'] ?? tokens?['refreshToken']) as String,
      expiresIn: (json['expiresIn'] ?? tokens?['expiresIn']) as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      if (expiresIn != null) 'expiresIn': expiresIn,
    };
  }

  factory AuthTokensModel.fromDomain(AuthTokens authTokens) {
    return AuthTokensModel(
      accessToken: authTokens.accessToken,
      refreshToken: authTokens.refreshToken,
      expiresIn: authTokens.expiresIn,
    );
  }

  AuthTokens toDomain() {
    return AuthTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresIn: expiresIn,
    );
  }
}
