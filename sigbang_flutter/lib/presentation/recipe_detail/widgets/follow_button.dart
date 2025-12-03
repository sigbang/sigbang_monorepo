import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:get_it/get_it.dart';
import 'package:go_router/go_router.dart';
import '../../../data/datasources/api_client.dart';

class FollowButton extends StatefulWidget {
  final String authorId;
  final bool isLoggedIn;
  final bool? initialIsFollowing;

  const FollowButton({
    super.key,
    required this.authorId,
    required this.isLoggedIn,
    this.initialIsFollowing,
  });

  @override
  State<FollowButton> createState() => _FollowButtonState();
}

class _FollowButtonState extends State<FollowButton> {
  bool _isFollowing = false;
  bool _loading = false;

  ApiClient get _api => GetIt.I<ApiClient>();

  @override
  void initState() {
    super.initState();
    _isFollowing = widget.initialIsFollowing ?? false;
    if (widget.isLoggedIn && widget.initialIsFollowing == null) {
      _fetchInitialRelation();
    }
  }

  Future<void> _fetchInitialRelation() async {
    try {
      final res = await _api.dio.get('/users/${widget.authorId}');
      final raw = res.data is Map<String, dynamic>
          ? res.data as Map<String, dynamic>
          : ((res.data['data'] ?? res.data) as Map<String, dynamic>);
      final relation = (raw['relation'] as Map<String, dynamic>?) ?? const {};
      final isFollowing = relation['isFollowing'] as bool? ?? false;
      if (mounted) {
        setState(() {
          _isFollowing = isFollowing;
        });
      }
    } catch (e) {
      if (kDebugMode) {
        // Non-fatal
        print('⚠️ Failed to fetch relation: $e');
      }
    }
  }

  Future<void> _toggleFollow(BuildContext context) async {
    if (!widget.isLoggedIn || _loading) return;
    setState(() {
      _loading = true;
    });
    try {
      if (_isFollowing) {
        final res =
            await _api.dio.delete('/users/${widget.authorId}/follow');
        if (res.statusCode == 200 || res.statusCode == 204) {
          if (mounted) {
            setState(() {
              _isFollowing = false;
            });
          }
        }
      } else {
        final res = await _api.dio.post('/users/${widget.authorId}/follow');
        if (res.statusCode == 200 ||
            res.statusCode == 201 ||
            res.statusCode == 204) {
          if (mounted) {
            setState(() {
              _isFollowing = true;
            });
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isFollowing ? '언팔로우 실패' : '팔로우 실패'),
            duration: const Duration(seconds: 1),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final backgroundColor =
        _isFollowing ? Colors.black : Colors.amber; // amber when not following
    final foregroundColor = _isFollowing ? Colors.white : Colors.black;

    return SizedBox(
      height: 36,
      child: ElevatedButton(
        onPressed: () {
          if (_loading) return;
          if (!widget.isLoggedIn) {
            showDialog<void>(
              context: context,
              builder: (ctx) {
                return AlertDialog(
                  title: const Text('알림'),
                  content: const Text('로그인이 필요합니다.'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(ctx).pop(),
                      child: const Text('취소'),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.of(ctx).pop();
                        context.push('/login');
                      },
                      child: const Text('로그인'),
                    ),
                  ],
                );
              },
            );
            return;
          }
          _toggleFollow(context);
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          foregroundColor: foregroundColor,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        child: _loading
            ? SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor:
                      AlwaysStoppedAnimation<Color>(foregroundColor),
                ),
              )
            : Text(_isFollowing ? '팔로잉' : '팔로우'),
      ),
    );
  }
}
