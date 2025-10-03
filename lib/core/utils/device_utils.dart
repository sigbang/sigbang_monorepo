import 'dart:math';
import 'dart:io' show Platform;

class DeviceUtils {
  static String generateUuidV4() {
    final Random random = Random.secure();
    final List<int> bytes = List<int>.generate(16, (_) => random.nextInt(256));

    // Set version to 4 ---- 0100
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Set variant to 10xx
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    String _toHex(int b) => b.toRadixString(16).padLeft(2, '0');

    return '${_toHex(bytes[0])}${_toHex(bytes[1])}${_toHex(bytes[2])}${_toHex(bytes[3])}-'
        '${_toHex(bytes[4])}${_toHex(bytes[5])}-'
        '${_toHex(bytes[6])}${_toHex(bytes[7])}-'
        '${_toHex(bytes[8])}${_toHex(bytes[9])}-'
        '${_toHex(bytes[10])}${_toHex(bytes[11])}${_toHex(bytes[12])}${_toHex(bytes[13])}${_toHex(bytes[14])}${_toHex(bytes[15])}';
  }

  static String getDeviceName() {
    try {
      if (Platform.isAndroid) return 'Android Device';
      if (Platform.isIOS) return 'iOS Device';
      if (Platform.isMacOS) return 'macOS';
      if (Platform.isWindows) return 'Windows';
      if (Platform.isLinux) return 'Linux';
    } catch (_) {
      // Platform not available (e.g., web); fallthrough
    }
    return 'Unknown Device';
  }
}
