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
import { SetDefaultProfileImageDto } from './dto/set-default-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private prismaService: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  private readonly PROFILE_BUCKET = 'recipes';
  private readonly PRESET_DIR = 'profiles/presets';

  private isUserUploadedProfileUrl(userId: string, url?: string) {
    return !!url && url.includes(`/profiles/${userId}/`);
  }

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

    try {
      const before = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { nickname: true },
      });

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

      // 닉네임 변경 이력 기록 (PROFILE_UPDATE)
      if (nickname && before?.nickname !== nickname) {
        try {
          await (this.prismaService as any).userLifecycleEvent.create({
            data: {
              userId,
              type: 'PROFILE_UPDATE',
              actorType: 'USER',
              actorId: userId,
              reason: JSON.stringify({ prevNickname: before?.nickname, nextNickname: nickname }),
              source: 'profile',
            },
          });
        } catch {}
      }

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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.mimetype.toLowerCase())) {
      throw new BadRequestException('JPG, PNG, WebP, HEIC 파일만 업로드 가능합니다.');
    }

    // 파일 크기 검증 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('파일 크기는 5MB를 초과할 수 없습니다.');
    }

    try {
      const bucketName = 'recipes';
      const cacheSeconds = 60 * 60 * 24 * 365; // 1년
      
      // Sharp로 이미지 처리: 회전, 리사이즈, WebP 변환
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sharp = require('sharp');
      try { sharp.concurrency?.(2); } catch {}
      const processed = await sharp(file.buffer)
        .rotate()
        .resize({ width: 800, height: 800, fit: 'cover', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      const fileName = `profiles/${userId}/${Date.now()}.webp`;

      // 기존 프로필 이미지 정리 (내 업로드인 경우에만 삭제)
      const current = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { profileImage: true },
      });

      if (this.isUserUploadedProfileUrl(userId, current?.profileImage)) {
        const oldFile = (current as any).profileImage.split('/').pop();
        if (oldFile) {
          await this.supabaseService.deleteFile(bucketName, [`profiles/${userId}/${oldFile}`]);
        }
      }

      // 새 파일 업로드
      await this.supabaseService.uploadFile(
        bucketName,
        fileName,
        processed,
        'image/webp',
        cacheSeconds,
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

  // 기본 제공 프로필 이미지 목록 조회
  async listDefaultProfileImages() {
    const rows = await this.supabaseService.listFiles(this.PROFILE_BUCKET, this.PRESET_DIR);
    const images = (rows as any[])
      .filter((r) => r.name && !String(r.name).endsWith('/'))
      .map((f) => ({
        key: f.name,
        path: `${this.PRESET_DIR}/${f.name}`,
        url: this.supabaseService.getPublicUrl(this.PROFILE_BUCKET, `${this.PRESET_DIR}/${f.name}`),
      }));
    return { images };
  }

  // 기본 제공 이미지로 설정
  async setDefaultProfileImage(userId: string, key: string) {
    const path = key.includes('/') ? key : `${this.PRESET_DIR}/${key}`;
    const rows = await this.supabaseService.listFiles(this.PROFILE_BUCKET, this.PRESET_DIR);
    const exists = (rows as any[]).some((f) => `${this.PRESET_DIR}/${f.name}` === path);
    if (!exists) {
      throw new BadRequestException('올바르지 않은 기본 이미지 키입니다.');
    }

    const current = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { profileImage: true },
    });

    // 기존 업로드 이미지면 삭제
    if (this.isUserUploadedProfileUrl(userId, current?.profileImage)) {
      const oldFile = (current as any).profileImage.split('/').pop();
      if (oldFile) {
        await this.supabaseService.deleteFile(this.PROFILE_BUCKET, [`profiles/${userId}/${oldFile}`]);
      }
    }

    const url = this.supabaseService.getPublicUrl(this.PROFILE_BUCKET, path);
    const updated = await this.prismaService.user.update({
      where: { id: userId },
      data: { profileImage: url },
      select: { id: true, email: true, nickname: true, profileImage: true, bio: true, createdAt: true },
    });
    return { message: '기본 프로필 이미지로 변경되었습니다.', user: updated };
  }

  // 무작위 기본 이미지로 설정
  async setRandomDefaultProfileImage(userId: string) {
    const rows = await this.supabaseService.listFiles(this.PROFILE_BUCKET, this.PRESET_DIR);
    const files = (rows as any[]).filter((r) => r.name && !String(r.name).endsWith('/'));
    if (!files.length) {
      throw new BadRequestException('사용 가능한 기본 이미지가 없습니다.');
    }
    const pick = files[Math.floor(Math.random() * files.length)];
    return this.setDefaultProfileImage(userId, pick.name);
  }

  async deleteAccount(userId: string) {
    try {
      const prev = await this.prismaService.user.findUnique({ where: { id: userId }, select: { status: true } });
      // Soft delete - status=DELETED, deletedAt
      await this.prismaService.$transaction(async (tx) => {
        await tx.user.update({ where: { id: userId }, data: { status: 'DELETED' as any, deletedAt: new Date() } });
        await tx.recipe.updateMany({ where: { authorId: userId }, data: { authorId: null } });
        await tx.comment.updateMany({ where: { authorId: userId }, data: { authorId: null } });
        // Revoke all refresh tokens (immediate logout)
        await tx.refreshToken.deleteMany({ where: { userId } });
        await (tx as any).userLifecycleEvent.create({
          data: {
            userId,
            type: 'DELETE',
            actorType: 'USER',
            actorId: userId,
            prevStatus: (prev as any)?.status,
            nextStatus: 'DELETED',
            source: 'email',
          },
        });
      });

      return { message: '계정이 성공적으로 탈퇴되었습니다.' };
    } catch (error) {
      throw new BadRequestException('계정 탈퇴 중 오류가 발생했습니다.');
    }
  }

  async findUserById(userId: string, viewerId?: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
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

    if (!user || (user as any).status !== 'ACTIVE') {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    let isFollowing: boolean | undefined;
    let isFollowedBy: boolean | undefined;
    if (viewerId && viewerId !== userId) {
      const [a, b] = await Promise.all([
        (this.prismaService as any).follow.count({ where: { followerId: viewerId, followingId: userId } }),
        (this.prismaService as any).follow.count({ where: { followerId: userId, followingId: viewerId } }),
      ]);
      isFollowing = a > 0;
      isFollowedBy = b > 0;
    }

    return {
      ...user,
      recipesCount: user._count.recipes,
      relation: viewerId ? { isFollowing: !!isFollowing, isFollowedBy: !!isFollowedBy } : undefined,
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
        isHidden: false,
        ...(isOwner ? {} : { status: 'PUBLISHED' }),
      },
      take: limit + 1,
      ...(decodedCursor && { cursor: { id: decodedCursor.id }, skip: 1 }),
      orderBy,
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
            saves: true,
          },
        },
        ...(requestUserId && {
          likes: {
            where: { userId: requestUserId },
            select: { id: true },
          },
          saves: {
            where: { userId: requestUserId },
            select: { id: true },
          },
        }),
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

    const recipes = items.map((recipe: any) => ({
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
      isLiked: requestUserId ? (Array.isArray(recipe.likes) && recipe.likes.length > 0) : false,
      isSaved: requestUserId ? (Array.isArray(recipe.saves) && recipe.saves.length > 0) : false,
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
      where: {
        userId,
        recipe: { isHidden: false, status: 'PUBLISHED' as any },
      },
      take: limit + 1,
      ...(decodedCursor && { cursor: { id: decodedCursor.id }, skip: 1 }),
      orderBy,
      include: {
        recipe: {
          include: {
            author: {
              select: { id: true, nickname: true, profileImage: true },
            },
            _count: { select: { likes: true, comments: true, saves: true } },
            likes: {
              where: { userId },
              select: { id: true },
            },
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

    const recipes = items.map((save: any) => ({
      ...save.recipe,
      savedAt: save.createdAt,
      likesCount: save.recipe._count.likes,
      commentsCount: save.recipe._count.comments,
      isLiked: Array.isArray(save.recipe.likes) && save.recipe.likes.length > 0,
      // 북마크 탭에서는 항상 내가 저장한 레시피이므로 true 고정
      isSaved: true,
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

  async follow(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('자기 자신을 팔로우할 수 없습니다.');
    }
    const target = await this.prismaService.user.findUnique({ where: { id: targetUserId }, select: { status: true } });
    if (!target || (target as any).status !== 'ACTIVE') {
      throw new NotFoundException('대상 사용자를 찾을 수 없습니다.');
    }
    await (this.prismaService as any).follow.upsert({
      where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
      update: {},
      create: { followerId: userId, followingId: targetUserId },
    });
    return { followed: true };
  }

  async unfollow(userId: string, targetUserId: string) {
    await (this.prismaService as any).follow.deleteMany({
      where: { followerId: userId, followingId: targetUserId },
    });
    return { followed: false };
  }

  async getFollowers(userId: string, viewerId?: string, query?: { cursor?: string; limit?: number }) {
    const { cursor, limit = 20 } = (query ?? {}) as any;
    let decoded: { id: string; createdAt?: string } | null = null;
    if (cursor) {
      try { decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8')); } catch {}
    }

    const rows = await (this.prismaService as any).follow.findMany({
      where: { followingId: userId, follower: { status: 'ACTIVE' } },
      take: limit + 1,
      ...(decoded && { cursor: { id: decoded.id }, skip: 1 }),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        follower: { select: { id: true, nickname: true, profileImage: true } },
      },
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    const nextCursor = last ? Buffer.from(JSON.stringify({ id: last.id, createdAt: last.createdAt })).toString('base64') : null;

    let viewerFollowing = new Set<string>();
    let viewerFollowers = new Set<string>();
    if (viewerId) {
      const peerIds = items.map((r: any) => r.follower.id);
      const [vf, vb] = await Promise.all([
        (this.prismaService as any).follow.findMany({
          where: { followerId: viewerId, followingId: { in: peerIds } },
          select: { followingId: true },
        }),
        (this.prismaService as any).follow.findMany({
          where: { followerId: { in: peerIds }, followingId: viewerId },
          select: { followerId: true },
        }),
      ]);
      viewerFollowing = new Set(vf.map((x: any) => x.followingId));
      viewerFollowers = new Set(vb.map((x: any) => x.followerId));
    }

    const users = items.map((r: any) => ({
      id: r.follower.id,
      nickname: r.follower.nickname,
      profileImage: r.follower.profileImage,
      followedAt: r.createdAt,
      ...(viewerId ? {
        isFollowing: viewerFollowing.has(r.follower.id),
        isFollowedBy: viewerFollowers.has(r.follower.id),
      } : {}),
    }));

    return { users, pageInfo: { limit, nextCursor, hasMore } };
  }

  async getFollowings(userId: string, viewerId?: string, query?: { cursor?: string; limit?: number }) {
    const { cursor, limit = 20 } = (query ?? {}) as any;
    let decoded: { id: string; createdAt?: string } | null = null;
    if (cursor) {
      try { decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8')); } catch {}
    }

    const rows = await (this.prismaService as any).follow.findMany({
      where: { followerId: userId, following: { status: 'ACTIVE' } },
      take: limit + 1,
      ...(decoded && { cursor: { id: decoded.id }, skip: 1 }),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        following: { select: { id: true, nickname: true, profileImage: true } },
      },
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    const nextCursor = last ? Buffer.from(JSON.stringify({ id: last.id, createdAt: last.createdAt })).toString('base64') : null;

    let viewerFollowing = new Set<string>();
    let viewerFollowers = new Set<string>();
    if (viewerId) {
      const peerIds = items.map((r: any) => r.following.id);
      const [vf, vb] = await Promise.all([
        (this.prismaService as any).follow.findMany({
          where: { followerId: viewerId, followingId: { in: peerIds } },
          select: { followingId: true },
        }),
        (this.prismaService as any).follow.findMany({
          where: { followerId: { in: peerIds }, followingId: viewerId },
          select: { followerId: true },
        }),
      ]);
      viewerFollowing = new Set(vf.map((x: any) => x.followingId));
      viewerFollowers = new Set(vb.map((x: any) => x.followerId));
    }

    const users = items.map((r: any) => ({
      id: r.following.id,
      nickname: r.following.nickname,
      profileImage: r.following.profileImage,
      followedAt: r.createdAt,
      ...(viewerId ? {
        isFollowing: viewerFollowing.has(r.following.id),
        isFollowedBy: viewerFollowers.has(r.following.id),
      } : {}),
    }));

    return { users, pageInfo: { limit, nextCursor, hasMore } };
  }

  // 히스토리 조회 (selfView: IP/UA 마스킹)
  async getUserHistory(userId: string, opts?: { limit?: number; cursor?: string }, selfView?: boolean) {
    const limit = Math.max(1, Math.min(100, Number(opts?.limit ?? 20)));
    let decoded: { id: string; createdAt?: string } | null = null;
    if (opts?.cursor) {
      try { decoded = JSON.parse(Buffer.from(opts.cursor, 'base64').toString('utf-8')); } catch {}
    }
    const rows = await (this.prismaService as any).userLifecycleEvent.findMany({
      where: { userId },
      take: limit + 1,
      ...(decoded && { cursor: { id: decoded.id }, skip: 1 }),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    const nextCursor = last ? Buffer.from(JSON.stringify({ id: last.id, createdAt: last.createdAt })).toString('base64') : null;
    const masked = items.map((e: any) => ({
      id: e.id,
      userId: e.userId,
      type: e.type,
      actorType: e.actorType,
      actorId: e.actorId,
      prevStatus: e.prevStatus,
      nextStatus: e.nextStatus,
      reason: e.reason,
      ip: selfView ? (e.ip ? e.ip.replace(/(\d+\.\d+\.)(\d+\.\d+)/, '$1xx.xx') : null) : e.ip,
      userAgent: selfView ? undefined : e.userAgent,
      source: e.source,
      createdAt: e.createdAt,
    }));
    return { items: masked, pageInfo: { limit, nextCursor, hasMore } };
  }
}