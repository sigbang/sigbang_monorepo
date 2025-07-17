import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private prismaService: PrismaService) {}

  async create(userId: string, recipeId: string, content: string) {
    const recipe = await this.prismaService.recipe.findUnique({
      where: { id: recipeId, isPublished: true, isHidden: false },
    });

    if (!recipe) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    const comment = await this.prismaService.comment.create({
      data: {
        content,
        authorId: userId,
        recipeId,
      },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
    });

    return { message: '댓글이 작성되었습니다.', comment };
  }

  async findByRecipe(recipeId: string) {
    return this.prismaService.comment.findMany({
      where: {
        recipeId,
        isHidden: false,
      },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.prismaService.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('댓글을 삭제할 권한이 없습니다.');
    }

    await this.prismaService.comment.delete({
      where: { id: commentId },
    });

    return { message: '댓글이 삭제되었습니다.' };
  }
} 