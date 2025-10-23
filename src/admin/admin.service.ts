import { Injectable, NotFoundException } from '@nestjs/common';
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

  async restoreRecipe(recipeId: string, adminId: string, reason?: string) {
    const recipe = await this.prismaService.recipe.findUnique({ where: { id: recipeId }, select: { id: true } });
    if (!recipe) throw new NotFoundException('레시피를 찾을 수 없습니다.');

    await this.prismaService.recipe.update({
      where: { id: recipeId },
      data: { isHidden: false },
    });

    await this.prismaService.adminAction.create({
      data: {
        action: 'UNHIDE_RECIPE' as any,
        targetType: 'recipe',
        targetId: recipeId,
        reason,
        adminId,
      },
    });

    return { message: '레시피가 복구되었습니다.' };
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
    const prev = await this.prismaService.user.findUnique({ where: { id: userId }, select: { status: true } });
    await this.prismaService.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { status: 'SUSPENDED' as any } });
      await (tx as any).userLifecycleEvent.create({
        data: {
          userId,
          type: 'SUSPEND',
          actorType: 'ADMIN',
          actorId: adminId,
          prevStatus: (prev as any)?.status,
          nextStatus: 'SUSPENDED',
          reason,
          source: 'admin',
        },
      });
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