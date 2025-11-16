import 'package:flutter/widgets.dart';
import 'package:flutter_svg/flutter_svg.dart';

class AppLogo extends StatelessWidget {
  const AppLogo({super.key, this.height = 28});

  final double height;

  @override
  Widget build(BuildContext context) {
    return SvgPicture.asset(
      'assets/images/logo_appbar.svg',
      height: height,
      fit: BoxFit.contain,
      semanticsLabel: 'app logo',
    );
  }
}
