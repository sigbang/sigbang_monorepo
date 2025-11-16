import 'dart:convert';

class JwtUtils {
  /// Returns epoch seconds from the `exp` claim, or null if not present/invalid.
  static int? getExpiryEpochSeconds(String jwt) {
    try {
      final parts = jwt.split('.');
      if (parts.length != 3) return null;
      final payload = _decodeBase64(parts[1]);
      final Map<String, dynamic> jsonMap = json.decode(payload);
      final exp = jsonMap['exp'];
      if (exp is int) return exp;
      if (exp is String) return int.tryParse(exp);
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Returns true if the token is expired or will expire within [leewaySeconds].
  static bool isExpired(String jwt, {int leewaySeconds = 30}) {
    final exp = getExpiryEpochSeconds(jwt);
    if (exp == null)
      return false; // If no exp, assume not expired to avoid false logouts
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    return now >= (exp - leewaySeconds);
  }

  static String _decodeBase64(String str) {
    var output = str.replaceAll('-', '+').replaceAll('_', '/');

    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += '==';
        break;
      case 3:
        output += '=';
        break;
      default:
        throw const FormatException('Invalid Base64Url string');
    }
    return utf8.decode(base64.decode(output));
  }
}
