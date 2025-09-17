import '../../../domain/entities/user.dart' show UserStatus;

enum ActionType {
  createRecipe,
  editRecipe,
  likeRecipe,
  saveRecipe,
  addComment,
  editComment,
  deleteComment,
}

class ActionGuard {
  static bool canPerform(UserStatus? userStatus, ActionType action) {
    if (userStatus == null) return false;

    switch (userStatus) {
      case UserStatus.active:
        return true;
      case UserStatus.suspended:
        // Suspended users cannot perform any write operations
        return false;
      case UserStatus.deleted:
        // Deleted users cannot perform any operations
        return false;
    }
  }

  static String getRestrictionMessage(ActionType action) {
    switch (action) {
      case ActionType.createRecipe:
        return '계정이 일시 정지되어 레시피를 생성할 수 없습니다';
      case ActionType.editRecipe:
        return '계정이 일시 정지되어 레시피를 수정할 수 없습니다';
      case ActionType.likeRecipe:
        return '계정이 일시 정지되어 좋아요를 누를 수 없습니다';
      case ActionType.saveRecipe:
        return '계정이 일시 정지되어 레시피를 저장할 수 없습니다';
      case ActionType.addComment:
        return '계정이 일시 정지되어 댓글을 작성할 수 없습니다';
      case ActionType.editComment:
        return '계정이 일시 정지되어 댓글을 수정할 수 없습니다';
      case ActionType.deleteComment:
        return '계정이 일시 정지되어 댓글을 삭제할 수 없습니다';
    }
  }
}
