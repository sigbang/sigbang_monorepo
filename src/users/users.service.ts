import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../database/supabase.service';
import { UpdateUserDto } from './dto/users.dto';
import { UsersRecipesQueryDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    private prismaService: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  async findMe(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            recipes: {
              where: { status: 'PUBLISHED', isHidden: false }
            },
            likes: true,
            saves: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return {
      ...user,
      stats: {
        recipesCount: user._count.recipes,
        likesCount: user._count.likes,
        savesCount: user._count.saves,
      },
    };
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    const { nickname, bio } = updateUserDto;

    // 닉네임 변경 시 중복 체크
    if (nickname) {
      const existingUser = await this.prismaService.user.findFirst({
        where: {
          nickname,
          id: { not: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('이미 사용 중인 닉네임입니다.');
      }
    }

    try {
      const updatedUser = await this.prismaService.user.update({
        where: { id: userId },
        data: {
          ...(nickname && { nickname }),
          ...(bio !== undefined && { bio }),
        },
        select: {
          id: true,
          email: true,
          nickname: true,
          profileImage: true,
          bio: true,
          createdAt: true,
        },
      });

      return {
        message: '프로필이 성공적으로 업데이트되었습니다.',
        user: updatedUser,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('프로필 업데이트 중 오류가 발생했습니다.');
    }
  }

  async uploadProfileImage(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('JPG, PNG, WebP 파일만 업로드 가능합니다.');
    }

    // 파일 크기 검증 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('파일 크기는 5MB를 초과할 수 없습니다.');
    }

    try {
      const fileName = `profiles/${userId}/${Date.now()}-${file.originalname}`;
      const bucketName = 'recipe-images';

      // 기존 프로필 이미지 삭제
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { profileImage: true },
      });

      if (user?.profileImage) {
        const oldPath = user.profileImage.split('/').pop();
        if (oldPath) {
          await this.supabaseService.deleteFile(bucketName, [`profiles/${userId}/${oldPath}`]);
        }
      }

      // 새 파일 업로드
      await this.supabaseService.uploadFile(
        bucketName,
        fileName,
        file.buffer,
        file.mimetype,
      );

      const imageUrl = this.supabaseService.getPublicUrl(bucketName, fileName);

      // 데이터베이스 업데이트
      const updatedUser = await this.prismaService.user.update({
        where: { id: userId },
        data: { profileImage: imageUrl },
        select: {
          id: true,
          email: true,
          nickname: true,
          profileImage: true,
          bio: true,
          createdAt: true,
        },
      });

      return {
        message: '프로필 이미지가 성공적으로 업로드되었습니다.',
        user: updatedUser,
      };
    } catch (error) {
      throw new BadRequestException('이미지 업로드 중 오류가 발생했습니다.');
    }
  }

  async deleteAccount(userId: string) {
    try {
      // Soft delete - isActive를 false로 설정
      await this.prismaService.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      // 사용자의 모든 레시피도 비공개 처리
      await this.prismaService.recipe.updateMany({
        where: { authorId: userId },
        data: { status: 'DRAFT' },
      });

      return { message: '계정이 성공적으로 탈퇴되었습니다.' };
    } catch (error) {
      throw new BadRequestException('계정 탈퇴 중 오류가 발생했습니다.');
    }
  }

  async findUserById(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId, isActive: true },
      include: {
        _count: {
          select: {
            recipes: {
              where: { status: 'PUBLISHED', isHidden: false }
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return {
      ...user,
      recipesCount: user._count.recipes,
    };
  }

  async getUserRecipes(userId: string, requestUserId?: string, query?: UsersRecipesQueryDto) {
    // 본인인지 확인하여 공개/비공개 레시피 구분
    const isOwner = userId === requestUserId;

    const { cursor, limit = 20 } = (query ?? {}) as UsersRecipesQueryDto;

    let decodedCursor: { id: string; createdAt?: string } | null = null;
    if (cursor) {
      try {
        decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
      } catch {
        decodedCursor = null;
      }
    }

    const orderBy: any = [{ createdAt: 'desc' }, { id: 'desc' }];

    const rows = await this.prismaService.recipe.findMany({
      where: {
        authorId: userId,
        ...(isOwner ? {} : { status: 'PUBLISHED', isHidden: false }),
      },
      take: limit + 1,
      ...(decodedCursor && { cursor: { id: decodedCursor.id }, skip: 1 }),
      orderBy,
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    const nextCursor = last
      ? Buffer.from(
          JSON.stringify({ id: last.id, createdAt: last.createdAt }),
        ).toString('base64')
      : null;

    const recipes = items.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      thumbnailImage: recipe.thumbnailImage,
      difficulty: recipe.difficulty,
      cookingTime: recipe.cookingTime,
      servings: recipe.servings,
      viewCount: recipe.viewCount,
      createdAt: recipe.createdAt,
      status: recipe.status,
      likesCount: recipe._count.likes,
      commentsCount: recipe._count.comments,
    }));

    return {
      recipes,
      pageInfo: {
        limit,
        nextCursor,
        hasMore,
      },
    };
  }

  async getUserSavedRecipes(userId: string, query?: UsersRecipesQueryDto) {
    const { cursor, limit = 20 } = (query ?? {}) as UsersRecipesQueryDto;

    let decodedCursor: { id: string; createdAt?: string } | null = null;
    if (cursor) {
      try {
        decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
      } catch {
        decodedCursor = null;
      }
    }

    const orderBy: any = [{ createdAt: 'desc' }, { id: 'desc' }];

    const rows = await this.prismaService.save.findMany({
      where: { userId },
      take: limit + 1,
      ...(decodedCursor && { cursor: { id: decodedCursor.id }, skip: 1 }),
      orderBy,
      include: {
        recipe: {
          include: {
            author: {
              select: { id: true, nickname: true, profileImage: true },
            },
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    const nextCursor = last
      ? Buffer.from(
          JSON.stringify({ id: last.id, createdAt: last.createdAt }),
        ).toString('base64')
      : null;

    const recipes = items.map(save => ({
      ...save.recipe,
      savedAt: save.createdAt,
      likesCount: save.recipe._count.likes,
      commentsCount: save.recipe._count.comments,
    }));

    return {
      recipes,
      pageInfo: {
        limit,
        nextCursor,
        hasMore,
      },
    };
  }

  async getFollowCounts(userId: string) {
    const [followerCount, followingCount] = await Promise.all([
      this.prismaService.follow.count({ where: { followingId: userId } }),
      this.prismaService.follow.count({ where: { followerId: userId } }),
    ]);

    return { followerCount, followingCount };
  }
}