import 'package:flutter/material.dart';
import '../../../domain/entities/recipe.dart';
import 'follow_button.dart';

class RecipeAuthorHeader extends StatelessWidget {
  final Author author;
  final bool showFollowButton;
  final bool isLoggedIn;

  const RecipeAuthorHeader({
    super.key,
    required this.author,
    required this.isLoggedIn,
    this.showFollowButton = true,
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
        if (showFollowButton)
          FollowButton(
            authorId: author.id,
            isLoggedIn: isLoggedIn,
          ),
      ],
    );
  }
}
