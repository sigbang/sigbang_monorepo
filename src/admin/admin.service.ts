import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prismaService: PrismaService) {}

  async hideRecipe(recipeId: string, adminId: string, reason?: string) {
    await this.prismaService.recipe.update({
      where: { id: recipeId },
      data: { isHidden: true },
    });

    await this.prismaService.adminAction.create({
      data: {
        action: 'HIDE_RECIPE',
        targetType: 'recipe',
        targetId: recipeId,
        reason,
        adminId,
      },
    });

    return { message: '레시피가 숨김 처리되었습니다.' };
  }

  async hideComment(commentId: string, adminId: string, reason?: string) {
    await this.prismaService.comment.update({
      where: { id: commentId },
      data: { isHidden: true },
    });

    await this.prismaService.adminAction.create({
      data: {
        action: 'HIDE_COMMENT',
        targetType: 'comment',
        targetId: commentId,
        reason,
        adminId,
      },
    });

    return { message: '댓글이 숨김 처리되었습니다.' };
  }

  async blockUser(userId: string, adminId: string, reason?: string) {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });

    await this.prismaService.adminAction.create({
      data: {
        action: 'BLOCK_USER',
        targetType: 'user',
        targetId: userId,
        reason,
        adminId,
      },
    });

    return { message: '사용자가 차단되었습니다.' };
  }

  async getReports() {
    return this.prismaService.report.findMany({
      where: { status: 'PENDING' },
      include: {
        reporter: {
          select: {
            id: true,
            nickname: true,
          },
        },
        recipe: {
          select: {
            id: true,
            title: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
} 