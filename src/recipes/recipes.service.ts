import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../database/supabase.service';
import { CreateRecipeDto, UpdateRecipeDto, RecipeQueryDto } from './dto/recipes.dto';

@Injectable()
export class RecipesService {
  constructor(
    private prismaService: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  async create(userId: string, createRecipeDto: CreateRecipeDto) {
    const { tags, ...recipeData } = createRecipeDto;

    try {
      const recipe = await this.prismaService.recipe.create({
        data: {
          ...recipeData,
          authorId: userId,
          images: [], // 초기에는 빈 배열, 별도로 이미지 업로드 API 사용
        },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      // 태그 처리
      if (tags && tags.length > 0) {
        await this.handleTags(recipe.id, tags);
      }

      return {
        message: '레시피가 성공적으로 생성되었습니다.',
        recipe: {
          ...recipe,
          likesCount: recipe._count.likes,
          commentsCount: recipe._count.comments,
        },
      };
    } catch (error) {
      throw new BadRequestException('레시피 생성 중 오류가 발생했습니다.');
    }
  }

  async findAll(query: RecipeQueryDto, userId?: string) {
    const { page = 1, limit = 10, sortBy = 'latest', difficulty, search, tag, maxCookingTime } = query;
    const skip = (page - 1) * limit;

    // 기본 where 조건
    const where: any = {
      isPublished: true,
      isHidden: false,
    };

    // 필터 조건 추가
    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (maxCookingTime) {
      where.cookingTime = {
        lte: maxCookingTime,
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ingredients: { hasSome: [search] } },
      ];
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: { equals: tag, mode: 'insensitive' },
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
      tags: recipe.tags.map(t => t.tag.name),
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
  }

  async findOne(id: string, userId?: string) {
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

    if (!recipe.isPublished && recipe.authorId !== userId) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    if (recipe.isHidden && recipe.authorId !== userId) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    // 조회수 증가 (작성자 본인이 아닌 경우)
    if (recipe.authorId !== userId) {
      await this.prismaService.recipe.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return {
      ...recipe,
      tags: recipe.tags.map(t => t.tag.name),
      likesCount: recipe._count.likes,
      commentsCount: recipe._count.comments,
      isLiked: userId ? recipe.likes?.length > 0 : false,
      isSaved: userId ? recipe.saves?.length > 0 : false,
    };
  }

  async update(id: string, userId: string, updateRecipeDto: UpdateRecipeDto) {
    const recipe = await this.prismaService.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    if (recipe.authorId !== userId) {
      throw new ForbiddenException('레시피를 수정할 권한이 없습니다.');
    }

    const { tags, ...recipeData } = updateRecipeDto;

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
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      // 태그 업데이트
      if (tags !== undefined) {
        await this.updateTags(id, tags);
      }

      return {
        message: '레시피가 성공적으로 수정되었습니다.',
        recipe: {
          ...updatedRecipe,
          likesCount: updatedRecipe._count.likes,
          commentsCount: updatedRecipe._count.comments,
        },
      };
    } catch (error) {
      throw new BadRequestException('레시피 수정 중 오류가 발생했습니다.');
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
      // Soft delete - isPublished를 false로 설정
      await this.prismaService.recipe.update({
        where: { id },
        data: { isPublished: false },
      });

      return { message: '레시피가 성공적으로 삭제되었습니다.' };
    } catch (error) {
      throw new BadRequestException('레시피 삭제 중 오류가 발생했습니다.');
    }
  }

  async uploadImages(recipeId: string, userId: string, files: Express.Multer.File[]) {
    const recipe = await this.prismaService.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    if (recipe.authorId !== userId) {
      throw new ForbiddenException('레시피 이미지를 업로드할 권한이 없습니다.');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('업로드할 파일이 없습니다.');
    }

    const bucketName = 'recipe-images';
    const imageUrls: string[] = [];

    try {
      for (const file of files) {
        // 파일 타입 검증
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
          throw new BadRequestException('JPG, PNG, WebP 파일만 업로드 가능합니다.');
        }

        // 파일 크기 검증 (10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new BadRequestException('파일 크기는 10MB를 초과할 수 없습니다.');
        }

        const fileName = `recipes/${recipeId}/${Date.now()}-${file.originalname}`;
        
        await this.supabaseService.uploadFile(
          bucketName,
          fileName,
          file.buffer,
          file.mimetype,
        );

        const imageUrl = this.supabaseService.getPublicUrl(bucketName, fileName);
        imageUrls.push(imageUrl);
      }

      // 기존 이미지와 새 이미지 합치기
      const updatedImages = [...recipe.images, ...imageUrls];
      
      const updatedRecipe = await this.prismaService.recipe.update({
        where: { id: recipeId },
        data: { images: updatedImages },
      });

      return {
        message: '이미지가 성공적으로 업로드되었습니다.',
        images: updatedRecipe.images,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('이미지 업로드 중 오류가 발생했습니다.');
    }
  }

  private async handleTags(recipeId: string, tagNames: string[]) {
    for (const tagName of tagNames) {
      // 태그가 없으면 생성, 있으면 기존 것 사용
      const tag = await this.prismaService.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });

      // 레시피-태그 연결
      await this.prismaService.recipeTag.upsert({
        where: {
          recipeId_tagId: {
            recipeId,
            tagId: tag.id,
          },
        },
        update: {},
        create: {
          recipeId,
          tagId: tag.id,
        },
      });
    }
  }

  private async updateTags(recipeId: string, tagNames: string[]) {
    // 기존 태그 연결 삭제
    await this.prismaService.recipeTag.deleteMany({
      where: { recipeId },
    });

    // 새 태그 추가
    if (tagNames.length > 0) {
      await this.handleTags(recipeId, tagNames);
    }
  }
} 