import 'dart:async';
import 'package:flutter/material.dart';

class CookingTipCarousel extends StatefulWidget {
  final List<String> initialTips; // each tip supports up to 2 lines
  final Duration interval; // auto-rotate interval

  const CookingTipCarousel({
    super.key,
    required this.initialTips,
    this.interval = const Duration(seconds: 10),
  });

  @override
  State<CookingTipCarousel> createState() => _CookingTipCarouselState();
}

class _CookingTipCarouselState extends State<CookingTipCarousel> {
  late final PageController _controller;
  late List<String> _tips;
  Timer? _timer;
  int _current = 0;

  @override
  void initState() {
    super.initState();
    _controller = PageController(viewportFraction: 1.0);
    _tips = List<String>.from(widget.initialTips);
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(widget.interval, (_) {
      if (!mounted || _tips.isEmpty) return;
      final nextIndex = _current + 1;
      if (nextIndex >= _tips.length) {
        // Wrap to first without scroll-back visual
        _controller.jumpToPage(0);
      } else {
        _controller.animateToPage(
          nextIndex,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: scheme.secondary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      clipBehavior: Clip.antiAlias,
      child: SizedBox(
        height: 64,
        child: PageView.builder(
          controller: _controller,
          onPageChanged: (index) {
            _current = index;
            _startTimer();
          },
          itemCount: _tips.length,
          itemBuilder: (context, index) {
            final tip = _tips[index];
            return _TipSlide(text: tip);
          },
        ),
      ),
    );
  }
}

class _TipSlide extends StatelessWidget {
  final String text;

  const _TipSlide({
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 350),
      switchInCurve: Curves.easeOut,
      switchOutCurve: Curves.easeIn,
      child: Container(
        key: ValueKey<String>(text),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        alignment: Alignment.centerLeft,
        child: Text(
          text,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}
