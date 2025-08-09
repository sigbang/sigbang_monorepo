import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../database/supabase.service';
import { 
  CreateRecipeDto, 
  UpdateRecipeDto, 
  RecipeQueryDto,
  RecipeResponseDto,
  DraftRecipeResponseDto,
  RecipeStatus 
} from './dto/recipes.dto';

@Injectable()
export class RecipesService {
  constructor(
    private prismaService: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  // 1. 레시피 임시 저장 생성
  async createDraft(userId: string, createRecipeDto: CreateRecipeDto) {
    const { tags, steps, ...recipeData } = createRecipeDto;

    try {
      // 사용자의 기존 임시 저장 전체 삭제 후 새로 생성
      await this.prismaService.recipe.deleteMany({
        where: {
          authorId: userId,
          status: RecipeStatus.DRAFT,
        },
      });

      const recipe = await this.prismaService.recipe.create({
        data: {
          ...recipeData,
          authorId: userId,
          status: RecipeStatus.DRAFT,
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

      // 태그 처리
      if (tags && tags.length > 0) {
        await this.handleTags(recipe.id, tags);
      }

      // 단계 처리
      if (steps && steps.length > 0) {
        await this.handleSteps(recipe.id, steps);
      }

      return {
        success: true,
        message: '기존 임시 저장을 모두 제거하고 새 임시 저장이 생성되었습니다.',
        data: {
          id: recipe.id,
          title: recipe.title,
          status: recipe.status,
          createdAt: recipe.createdAt,
        },
      };
    } catch (error) {
      throw new BadRequestException('레시피 임시 저장에 실패했습니다.');
    }
  }

  // 2. 레시피 임시 저장 수정
  async updateDraft(id: string, userId: string, updateRecipeDto: UpdateRecipeDto) {
    const recipe = await this.prismaService.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    if (recipe.authorId !== userId) {
      throw new ForbiddenException('레시피를 수정할 권한이 없습니다.');
    }

    if (recipe.status !== RecipeStatus.DRAFT) {
      throw new BadRequestException('임시 저장된 레시피만 수정할 수 있습니다.');
    }

    const { tags, steps, ...recipeData } = updateRecipeDto;

    try {
      const updatedRecipe = await this.prismaService.recipe.update({
        where: { id },
        data: recipeData,
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

      // 기존 태그 삭제 후 새로 추가
      if (tags !== undefined) {
        await this.prismaService.recipeTag.deleteMany({
          where: { recipeId: id },
        });
        if (tags.length > 0) {
          await this.handleTags(id, tags);
        }
      }

      // 기존 단계 삭제 후 새로 추가
      if (steps !== undefined) {
        await this.prismaService.recipeStep.deleteMany({
          where: { recipeId: id },
        });
        if (steps.length > 0) {
          await this.handleSteps(id, steps);
        }
      }

      return {
        success: true,
        message: '레시피가 수정되었습니다.',
        data: {
          id: updatedRecipe.id,
          title: updatedRecipe.title,
          status: updatedRecipe.status,
          updatedAt: updatedRecipe.updatedAt,
        },
      };
    } catch (error) {
      throw new BadRequestException('레시피 수정에 실패했습니다.');
    }
  }

  // 3. 레시피 공개
  async publish(id: string, userId: string) {
    const recipe = await this.prismaService.recipe.findUnique({
      where: { id },
      include: {
        steps: true,
      },
    });

    if (!recipe) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    if (recipe.authorId !== userId) {
      throw new ForbiddenException('레시피를 공개할 권한이 없습니다.');
    }

    if (recipe.status === RecipeStatus.PUBLISHED) {
      throw new BadRequestException('이미 공개된 레시피입니다.');
    }

    // 최소 요구사항 검증
    if (!recipe.steps || recipe.steps.length === 0) {
      throw new BadRequestException('최소 1개 이상의 조리 단계가 필요합니다.');
    }

    try {
      const publishedRecipe = await this.prismaService.recipe.update({
        where: { id },
        data: {
          status: RecipeStatus.PUBLISHED,
        },
      });

      return {
        success: true,
        message: '레시피가 공개되었습니다.',
        data: {
          id: publishedRecipe.id,
          title: publishedRecipe.title,
          status: publishedRecipe.status,
          updatedAt: publishedRecipe.updatedAt,
        },
      };
    } catch (error) {
      throw new BadRequestException('레시피 공개에 실패했습니다.');
    }
  }

  // 4. 내 임시 저장 목록 조회
  async getDraft(userId: string) {
    try {
      const draft = await this.prismaService.recipe.findFirst({
        where: {
          authorId: userId,
          status: RecipeStatus.DRAFT,
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return draft ?? null;
    } catch (error) {
      throw new BadRequestException('임시 저장 조회에 실패했습니다.');
    }
  }

  // 내 임시 저장 수정 (사용자 기준)
  async updateMyDraft(userId: string, updateRecipeDto: UpdateRecipeDto) {
    // 사용자의 단일 임시 저장을 조회
    const draft = await this.prismaService.recipe.findFirst({
      where: { authorId: userId, status: RecipeStatus.DRAFT },
    });

    if (!draft) {
      throw new NotFoundException('임시 저장된 레시피가 없습니다.');
    }

    return this.updateDraft(draft.id, userId, updateRecipeDto);
  }

  // 5. 레시피 상세 조회
  async getRecipe(id: string, userId?: string) {
    const recipe = await this.prismaService.recipe.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        steps: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        ...(userId && {
          likes: {
            where: { userId },
            select: { id: true },
          },
          saves: {
            where: { userId },
            select: { id: true },
          },
        }),
      },
    });

    if (!recipe) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    // 공개되지 않은 레시피는 작성자만 조회 가능
    if (recipe.status !== RecipeStatus.PUBLISHED && recipe.authorId !== userId) {
      throw new ForbiddenException('레시피를 조회할 권한이 없습니다.');
    }

    // 조회수 증가 (본인 글이 아닌 공개된 레시피인 경우)
    if (recipe.status === RecipeStatus.PUBLISHED && recipe.authorId !== userId) {
      await this.prismaService.recipe.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    const formattedRecipe = {
      ...recipe,
      tags: recipe.tags.map(t => ({
        name: t.tag.name,
        emoji: t.tag.emoji,
      })),
      steps: recipe.steps.map(step => ({
        order: step.order,
        description: step.description,
        imageUrl: step.imageUrl,
      })),
      likesCount: recipe._count.likes,
      commentsCount: recipe._count.comments,
      isLiked: userId ? recipe.likes?.length > 0 : false,
      isSaved: userId ? recipe.saves?.length > 0 : false,
    };

    return formattedRecipe;
  }

  // 6. 피드 조회 (공개된 레시피만)
  async getFeed(recipeQueryDto: RecipeQueryDto, userId?: string) {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'latest', 
      difficulty, 
      search, 
      tag, 
      maxCookingTime 
    } = recipeQueryDto;

    const skip = (page - 1) * limit;

    // 기본 조건: 공개된 레시피만
    const where: any = {
      status: RecipeStatus.PUBLISHED,
      isHidden: false,
    };

    // 필터 조건 추가
    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (maxCookingTime) {
      where.cookingTime = { lte: maxCookingTime };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ingredients: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: { contains: tag, mode: 'insensitive' },
          },
        },
      };
    }

    // 정렬 조건
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'popular') {
      orderBy = { likes: { _count: 'desc' } };
    } else if (sortBy === 'views') {
      orderBy = { viewCount: 'desc' };
    }

    try {
      const [recipes, total] = await Promise.all([
        this.prismaService.recipe.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            author: {
              select: {
                id: true,
                nickname: true,
                profileImage: true,
              },
            },
            tags: {
              include: {
                tag: true,
              },
            },
            steps: {
              orderBy: { order: 'asc' },
              take: 1, // 피드에서는 첫 번째 단계만
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
            ...(userId && {
              likes: {
                where: { userId },
                select: { id: true },
              },
              saves: {
                where: { userId },
                select: { id: true },
              },
            }),
          },
        }),
        this.prismaService.recipe.count({ where }),
      ]);

      const formattedRecipes = recipes.map(recipe => ({
        ...recipe,
        tags: recipe.tags.map(t => ({
          name: t.tag.name,
          emoji: t.tag.emoji,
        })),
        steps: recipe.steps.map(step => ({
          order: step.order,
          description: step.description,
          imageUrl: step.imageUrl,
        })),
        likesCount: recipe._count.likes,
        commentsCount: recipe._count.comments,
        isLiked: userId ? recipe.likes?.length > 0 : false,
        isSaved: userId ? recipe.saves?.length > 0 : false,
      }));

      return {
        recipes: formattedRecipes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new BadRequestException('피드 조회에 실패했습니다.');
    }
  }

  // 태그 처리 헬퍼 메소드
  private async handleTags(recipeId: string, tags: any[]) {
    for (const tagData of tags) {
      // 태그가 존재하지 않으면 생성
      let tag = await this.prismaService.tag.findUnique({
        where: { name: tagData.name },
      });

      if (!tag) {
        tag = await this.prismaService.tag.create({
          data: {
            name: tagData.name,
            emoji: tagData.emoji,
          },
        });
      } else if (tagData.emoji && tag.emoji !== tagData.emoji) {
        // 기존 태그에 이모지 업데이트
        tag = await this.prismaService.tag.update({
          where: { id: tag.id },
          data: { emoji: tagData.emoji },
        });
      }

      // 레시피-태그 연결
      await this.prismaService.recipeTag.create({
        data: {
          recipeId,
          tagId: tag.id,
        },
      });
    }
  }

  // 단계 처리 헬퍼 메소드
  private async handleSteps(recipeId: string, steps: any[]) {
    for (const stepData of steps) {
      await this.prismaService.recipeStep.create({
        data: {
          recipeId,
          order: stepData.order,
          description: stepData.description,
          imageUrl: stepData.imageUrl,
        },
      });
    }
  }

  // 기존 메소드들 (이미지 업로드, 삭제 등)
  async uploadImages(files: Express.Multer.File[], userId: string) {
    try {
      const uploadPromises = files.map(async (file) => {
        const fileName = `recipes/${userId}/${Date.now()}_${file.originalname}`;
        const { data, error } = await this.supabaseService.getClient().storage
          .from('recipe-images')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) throw error;

        const { data: urlData } = this.supabaseService.getClient().storage
          .from('recipe-images')  
          .getPublicUrl(data.path);

        return urlData.publicUrl;
      });

      const imageUrls = await Promise.all(uploadPromises);
      return { imageUrls };
    } catch (error) {
      throw new BadRequestException('이미지 업로드에 실패했습니다.');
    }
  }

  // 대표 이미지 업로드
  async uploadThumbnail(id: string, userId: string, file: Express.Multer.File) {
    const recipe = await this.prismaService.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    if (recipe.authorId !== userId) {
      throw new ForbiddenException('레시피를 수정할 권한이 없습니다.');
    }

    try {
      const fileName = `recipes/${userId}/thumbnails/${Date.now()}_${file.originalname}`;
      const { data, error } = await this.supabaseService.getClient().storage
        .from('recipe-images')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) throw error;

      const { data: urlData } = this.supabaseService.getClient().storage
        .from('recipe-images')
        .getPublicUrl(data.path);

      // 기존 대표 이미지가 있으면 삭제
      if (recipe.thumbnailImage) {
        const oldPath = recipe.thumbnailImage.split('/').slice(-1)[0];
        if (oldPath) {
          await this.supabaseService.getClient().storage
            .from('recipe-images')
            .remove([`recipes/${userId}/thumbnails/${oldPath}`]);
        }
      }

      // DB 업데이트
      await this.prismaService.recipe.update({
        where: { id },
        data: { thumbnailImage: urlData.publicUrl },
      });

      return {
        success: true,
        message: '대표 이미지가 업로드되었습니다.',
        thumbnailUrl: urlData.publicUrl,
      };
    } catch (error) {
      throw new BadRequestException('대표 이미지 업로드에 실패했습니다.');
    }
  }

  async remove(id: string, userId: string) {
    const recipe = await this.prismaService.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    if (recipe.authorId !== userId) {
      throw new ForbiddenException('레시피를 삭제할 권한이 없습니다.');
    }

    try {
      await this.prismaService.recipe.update({
        where: { id },
        data: { isHidden: true }, // Soft delete
      });

      return {
        success: true,
        message: '레시피가 삭제되었습니다.',
      };
    } catch (error) {
      throw new BadRequestException('레시피 삭제에 실패했습니다.');
    }
  }
}