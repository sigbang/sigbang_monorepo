import 'package:flutter/material.dart';
import '../../../domain/entities/recipe.dart';

class RecipeAuthorHeader extends StatelessWidget {
  final Author author;

  const RecipeAuthorHeader({
    super.key,
    required this.author,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          radius: 18,
          backgroundImage: author.profileImage != null
              ? NetworkImage(author.profileImage!)
              : null,
          child: author.profileImage == null
              ? Icon(
                  Icons.person,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                )
              : null,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                author.nickname,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              // subtitle removed per UI request
            ],
          ),
        ),
        TextButton(
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('프로필 화면은 곧 제공될 예정입니다'),
                duration: Duration(seconds: 1),
              ),
            );
          },
          child: const Text('팔로우'),
        )
      ],
    );
  }
}
