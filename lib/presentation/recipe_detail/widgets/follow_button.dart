import 'package:flutter/material.dart';

class FollowButton extends StatefulWidget {
  const FollowButton({super.key});

  @override
  State<FollowButton> createState() => _FollowButtonState();
}

class _FollowButtonState extends State<FollowButton> {
  bool _isFollowing = false;

  @override
  Widget build(BuildContext context) {
    final backgroundColor =
        _isFollowing ? Colors.black : Colors.amber; // amber when not following
    final foregroundColor = _isFollowing ? Colors.white : Colors.black;

    return SizedBox(
      height: 36,
      child: ElevatedButton(
        onPressed: () {
          setState(() {
            _isFollowing = !_isFollowing;
          });
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          foregroundColor: foregroundColor,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        child: Text(_isFollowing ? '팔로잉' : '팔로우'),
      ),
    );
  }
}
