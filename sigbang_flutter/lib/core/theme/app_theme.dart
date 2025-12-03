import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand colors
  // Main: #0F0F0F, Sub: #F2F2F2, Third: #FEC722
  static const _primaryColor = Color(0xFF0F0F0F);
  // static const _secondaryColor = Color(0xFFF2F2F2); // no longer used (white background)
  static const _tertiaryColor = Color(0xFFFEC722);
  static const _errorColor = Color(0xFFFF3B30);

  static ThemeData get lightTheme {
    final ColorScheme scheme = ColorScheme.fromSeed(
      seedColor: _tertiaryColor,
      brightness: Brightness.light,
    ).copyWith(
      primary: _primaryColor,
      onPrimary: Colors.white,
      secondary: Colors.amber,
      onSecondary: Colors.black,
      surface: Colors.white,
      onSurface: Colors.black,
      background: Colors.white,
      onBackground: Colors.black,
      error: _errorColor,
      onError: Colors.white,
    );

    final ThemeData baseLight = ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: Colors.white,
      popupMenuTheme: PopupMenuThemeData(
        color: Colors.white,
        surfaceTintColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      dialogTheme: const DialogThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.black,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: scheme.primary,
          foregroundColor: scheme.onPrimary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 16,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: scheme.primary),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 16,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide(
            color: scheme.outline.withOpacity(0.3),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide(
            color: scheme.outline.withOpacity(0.3),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide(
            color: scheme.primary.withOpacity(0.6),
            width: 1.5,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide(
            color: scheme.error,
          ),
        ),
        counterStyle: const TextStyle(fontSize: 0, height: 0),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        color: Colors.white,
      ),
      dividerTheme: DividerThemeData(
        color: Colors.grey.shade100, // 선 색상
        thickness: 8, // 두께
      ),
    );

    return baseLight.copyWith(
      textTheme: GoogleFonts.notoSansKrTextTheme(baseLight.textTheme),
      primaryTextTheme:
          GoogleFonts.notoSansKrTextTheme(baseLight.primaryTextTheme),
    );
  }

  static ThemeData get darkTheme {
    final ColorScheme scheme = ColorScheme.fromSeed(
      seedColor: _tertiaryColor,
      brightness: Brightness.dark,
    ).copyWith(
      primary: _primaryColor,
      onPrimary: Colors.white,
      secondary: _tertiaryColor,
      onSecondary: Colors.black,
      surface: const Color(0xFF121212),
      onSurface: Colors.white,
      background: _primaryColor,
      onBackground: Colors.white,
      error: _errorColor,
      onError: Colors.white,
    );

    final ThemeData baseDark = ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: scheme.background,
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: scheme.primary,
          foregroundColor: scheme.onPrimary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 16,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: scheme.primary),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 16,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        filled: true,
        fillColor: const Color(0xFF1E1E1E),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: const Color(0xFF1E1E1E),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    );

    return baseDark.copyWith(
      textTheme: GoogleFonts.notoSansKrTextTheme(baseDark.textTheme),
      primaryTextTheme:
          GoogleFonts.notoSansKrTextTheme(baseDark.primaryTextTheme),
    );
  }
}
