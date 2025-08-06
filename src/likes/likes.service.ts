import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class LikesService {
  constructor(private prismaService: PrismaService) {}

  async toggleLike(userId: string, recipeId: string) {
    // 레시피 존재 여부 확인
    const recipe = await this.prismaService.recipe.findUnique({
      where: { 
        id: recipeId,
        status: 'PUBLISHED',
        isHidden: false 
      },
    });

    if (!recipe) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    // 기존 좋아요 확인
    const existingLike = await this.prismaService.like.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId,
        },
      },
    });

    if (existingLike) {
      // 좋아요 취소
      await this.prismaService.like.delete({
        where: { id: existingLike.id },
      });
      return { message: '좋아요가 취소되었습니다.', isLiked: false };
    } else {
      // 좋아요 추가
      await this.prismaService.like.create({
        data: {
          userId,
          recipeId,
        },
      });
      return { message: '좋아요가 추가되었습니다.', isLiked: true };
    }
  }
} 