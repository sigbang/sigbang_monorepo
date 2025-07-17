import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../database/supabase.service';
import { UpdateUserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    private prismaService: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  async findMe(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        profileImage: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            recipes: {
              where: { isPublished: true, isHidden: false }
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
        data: { isPublished: false },
      });

      return { message: '계정이 성공적으로 탈퇴되었습니다.' };
    } catch (error) {
      throw new BadRequestException('계정 탈퇴 중 오류가 발생했습니다.');
    }
  }

  async findUserById(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        nickname: true,
        profileImage: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            recipes: {
              where: { isPublished: true, isHidden: false }
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

  async getUserRecipes(userId: string, requestUserId?: string) {
    // 본인인지 확인하여 공개/비공개 레시피 구분
    const isOwner = userId === requestUserId;

    const recipes = await this.prismaService.recipe.findMany({
      where: {
        authorId: userId,
        ...(isOwner ? {} : { isPublished: true, isHidden: false }),
      },
      select: {
        id: true,
        title: true,
        description: true,
        images: true,
        difficulty: true,
        cookingTime: true,
        servings: true,
        viewCount: true,
        createdAt: true,
        isPublished: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return recipes.map(recipe => ({
      ...recipe,
      likesCount: recipe._count.likes,
      commentsCount: recipe._count.comments,
    }));
  }

  async getUserSavedRecipes(userId: string) {
    const savedRecipes = await this.prismaService.save.findMany({
      where: { userId },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            description: true,
            images: true,
            difficulty: true,
            cookingTime: true,
            servings: true,
            viewCount: true,
            createdAt: true,
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return savedRecipes.map(save => ({
      ...save.recipe,
      savedAt: save.createdAt,
      likesCount: save.recipe._count.likes,
      commentsCount: save.recipe._count.comments,
    }));
  }
} 