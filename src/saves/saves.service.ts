import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SavesService {
  constructor(private prismaService: PrismaService) {}

  async toggleSave(userId: string, recipeId: string) {
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

    // 기존 저장 확인
    const existingSave = await this.prismaService.save.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId,
        },
      },
    });

    if (existingSave) {
      // 저장 취소
      await this.prismaService.save.delete({
        where: { id: existingSave.id },
      });
      return { message: '저장이 취소되었습니다.', isSaved: false };
    } else {
      // 저장 추가
      await this.prismaService.save.create({
        data: {
          userId,
          recipeId,
        },
      });
      return { message: '레시피가 저장되었습니다.', isSaved: true };
    }
  }
} 