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
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RecipesService {
  constructor(
    private prismaService: PrismaService,
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  // 레시피 생성 (즉시 공개)
  async create(userId: string, createRecipeDto: CreateRecipeDto) {
    const { tags, steps, thumbnailPath, ...recipeData } = createRecipeDto as any;

    // Supabase 버킷명
    const bucketName = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'recipe-images';    

    // 이미지 경로 정리: temp 경로를 정식 경로로 이동
    const now = Date.now();
    let finalThumbnailUrl: string | undefined = undefined;

    // temp/{userId}/... 에서 오는 경우 이동
    const isTempPath = (p?: string) => !!p && p.startsWith(`temp/${userId}/`);
    const toPublicUrl = (path: string) => this.supabaseService.getPublicUrl(bucketName, path);

    try {
      // 1) 썸네일 이동
      if (isTempPath(thumbnailPath)) {
        const tempKey = thumbnailPath!;
        const fileName = tempKey.split('/').pop() || `${now}.jpg`;
        const finalThumbKey = `recipes/${userId}/thumbnails/${now}_${fileName}`;
        await this.supabaseService.moveFile(bucketName, tempKey, finalThumbKey);
        finalThumbnailUrl = toPublicUrl(finalThumbKey);
      }

      // 2) DB에 레시피 생성 (PUBLISHED)
      const recipe = await this.prismaService.recipe.create({
        data: {
          ...recipeData,
          authorId: userId,
          status: RecipeStatus.PUBLISHED,
          ...(finalThumbnailUrl && { thumbnailImage: finalThumbnailUrl }),
        },
      });

      // 3) 태그 생성/연결
      if (tags && tags.length > 0) {
        await this.handleTags(recipe.id, tags);
      }

      // 4) 단계 생성 (스텝 이미지 이동 포함)
      if (steps && steps.length > 0) {
        const normalizedSteps = [] as Array<{ order: number; description: string; imageUrl?: string }>; 
        for (const step of steps as Array<{ order: number; description: string; imagePath?: string }>) {
          let imageUrl: string | undefined = undefined;
          if (isTempPath(step.imagePath)) {
            const tempKey = step.imagePath!;
            const fileName = tempKey.split('/').pop() || `${now}.jpg`;
            const finalStepKey = `recipes/${userId}/steps/${now}_${fileName}`;
            await this.supabaseService.moveFile(bucketName, tempKey, finalStepKey);
            imageUrl = toPublicUrl(finalStepKey);
          } else if (step.imagePath) {
            // imagePath가 이미 최종 key이거나 URL인 경우 처리
            imageUrl = step.imagePath.startsWith('http')
              ? step.imagePath
              : toPublicUrl(step.imagePath);
          }
          normalizedSteps.push({ order: step.order, description: step.description, imageUrl });
        }
        await this.handleSteps(recipe.id, normalizedSteps);
      }

      return { id: recipe.id };
    } catch (error) {
      throw new BadRequestException('레시피 생성에 실패했습니다.');
    }
  }

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

  // 6. 피드 조회 (커서 기반 블렌디드 피드)
  async getFeed(recipeQueryDto: RecipeQueryDto, userId?: string) {
    const {
      cursor,
      limit = 10,
      sortBy = 'latest',
      difficulty,
      search,
      tag,
      maxCookingTime,
      followingBoost,
      since,
    } = recipeQueryDto as any;

    // 필터 공통 where
    const baseWhere: any = {
      status: RecipeStatus.PUBLISHED,
      isHidden: false,
      ...(difficulty && { difficulty }),
      ...(maxCookingTime && { cookingTime: { lte: maxCookingTime } }),
      ...(tag && {
        tags: {
          some: { tag: { name: { contains: tag, mode: 'insensitive' } } },
        },
      }),
    };
    if (search) {
      baseWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ingredients: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 후보 상위 K 로드 (키셋: createdAt desc + id)
    const candidateTake = Math.max(limit * 5, 100); // 상위 후보 풀

    // 커서 디코딩: createdAt, id
    let decodedCursor: { createdAt: string; id: string } | null = null;
    if (cursor) {
      try {
        decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
      } catch {}
    }

    // 정렬: 최신 우선. 인기/조회 정렬은 MVP에선 점수식으로 흡수
    const orderBy: any = [{ createdAt: 'desc' }, { id: 'desc' }];

    // 내가 팔로잉하는 작성자 집합
    let followingAuthorIds: string[] = [];
    if (userId) {
      const followRows = await (this.prismaService as any).follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      followingAuthorIds = followRows.map(r => r.followingId);
    }

    // 상위 후보 K 로드 (키셋 커서 고려)
    const candidates = await this.prismaService.recipe.findMany({
      where: baseWhere,
      take: candidateTake,
      ...(decodedCursor && {
        cursor: { id: decodedCursor.id },
        skip: 1,
      }),
      orderBy,
      include: {
        author: { select: { id: true, nickname: true, profileImage: true } },
        tags: { include: { tag: true } },
        steps: { orderBy: { order: 'asc' }, take: 1 },
        _count: { select: { likes: true, comments: true, saves: true } },
        ...(userId && {
          likes: { where: { userId }, select: { id: true } },
          saves: { where: { userId }, select: { id: true } },
        }),
      },
    });

    // 점수 계산 파라미터 (MVP)
    const tauHours = 36;
    const wNew = 1.0;
    const wEng = 0.6;
    const wRecencyBurst = 0.3;
    let wFollow = 0.9;
    if (!followingAuthorIds || followingAuthorIds.length < 3) {
      wFollow = 0.3;
    }
    if (followingBoost) {
      wFollow = Math.max(wFollow, 0.9);
    }
    const alpha = 1;
    const beta = 2;
    const gamma = 1.5;

    const now = new Date().getTime();

    const categoryCooldown: Record<string, number> = {};

    function computeScore(r: any): number {
      const ageHours = (now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
      const decay = Math.exp(-ageHours / tauHours);
      const likes = r._count?.likes || 0;
      const comments = r._count?.comments || 0;
      const saves = r._count?.saves || 0;
      const engagement = Math.log(1 + alpha * likes + beta * comments + gamma * saves);
      const isFollowing = userId ? followingAuthorIds.includes(r.authorId) : false;
      const isVeryNew = ageHours * 60 < 30; // 30분 이내
      // 단순 카테고리 페널티: 동일 태그 반복을 경감 (MVP: 상수 0)
      const diversityPenalty = 0;
      return wNew * decay + wEng * engagement + wFollow * (isFollowing ? 1 : 0) + wRecencyBurst * (isVeryNew ? 1 : 0) + diversityPenalty;
    }

    // 후보 정렬
    const ranked = candidates
      .map(r => ({ r, score: computeScore(r) }))
      .sort((a, b) => b.score - a.score)
      .map(x => x.r);

    // 인터리빙 + 제약조건 적용
    const followingPool = ranked.filter(r => userId && followingAuthorIds.includes(r.authorId));
    const globalPool = ranked.filter(r => !userId || !followingAuthorIds.includes(r.authorId));
    const targetFollowingRatio = 0.6;
    const targetGlobalRatio = 0.4;

    const result: any[] = [];
    const recentAuthorWindow: string[] = [];
    const recentCategoryWindow: string[] = [];
    const pushWithConstraints = (candidate: any): boolean => {
      // 저자 쿨다운: 최근 5개 내 동일 저자 1회 이하
      if (recentAuthorWindow.slice(-5).filter(a => a === candidate.authorId).length >= 1) {
        return false;
      }
      // 카테고리 다양성: 같은 카테고리 3연속 금지 (단순: 첫 태그 기준)
      const cat = candidate.tags?.[0]?.tag?.name || '';
      const last3 = recentCategoryWindow.slice(-3);
      if (cat && last3.length >= 3 && last3.every(c => c === cat)) {
        return false;
      }
      result.push(candidate);
      recentAuthorWindow.push(candidate.authorId);
      recentCategoryWindow.push(cat);
      return true;
    };

    let fIdx = 0;
    let gIdx = 0;
    while (result.length < limit && (fIdx < followingPool.length || gIdx < globalPool.length)) {
      const fNeed = (result.length + 1) * targetFollowingRatio - result.filter(r => userId && followingAuthorIds.includes(r.authorId)).length;
      let picked = false;
      if (fNeed > 0 && fIdx < followingPool.length) {
        if (pushWithConstraints(followingPool[fIdx])) {
          picked = true;
        }
        fIdx += 1;
      }
      if (!picked && gIdx < globalPool.length) {
        if (pushWithConstraints(globalPool[gIdx])) {
          picked = true;
        }
        gIdx += 1;
      }
      if (!picked && fIdx < followingPool.length) {
        // 마지막 시도
        if (pushWithConstraints(followingPool[fIdx])) {
          picked = true;
        }
        fIdx += 1;
      }
      if (!picked) break;
    }

    // 신규 보호: 10개당 최소 1개 (가능 시)
    if (result.length > 0) {
      const veryNewExists = ranked.some(r => (now - new Date(r.createdAt).getTime()) / (1000 * 60) < 30);
      if (veryNewExists) {
        const chunk = 10;
        for (let i = 0; i < result.length; i += chunk) {
          const slice = result.slice(i, i + chunk);
          const hasVeryNew = slice.some(r => (now - new Date(r.createdAt).getTime()) / (1000 * 60) < 30);
          if (!hasVeryNew) {
            const candidate = ranked.find(r => (now - new Date(r.createdAt).getTime()) / (1000 * 60) < 30 && !slice.find(s => s.id === r.id));
            if (candidate) {
              slice.pop();
              slice.push(candidate);
              // 재배치
              result.splice(i, slice.length, ...slice);
            }
          }
        }
      }
    }

    // 다음 커서
    const last = result[result.length - 1];
    const nextCursor = last
      ? Buffer.from(JSON.stringify({ id: last.id, createdAt: last.createdAt })).toString('base64')
      : null;

    const formattedRecipes = result.map(recipe => ({
      ...recipe,
      tags: recipe.tags.map(t => ({ name: t.tag.name, emoji: t.tag.emoji })),
      steps: recipe.steps.map(step => ({ order: step.order, description: step.description, imageUrl: step.imageUrl })),
      likesCount: recipe._count.likes,
      commentsCount: recipe._count.comments,
      isLiked: userId ? recipe.likes?.length > 0 : false,
      isSaved: userId ? recipe.saves?.length > 0 : false,
    }));

    // 새 글 카운트 (스켈레톤/배지용): since 이후 생성된 공개 글 수
    let newCount: number | undefined = undefined;
    if (since) {
      try {
        const sinceDate = new Date(since);
        if (!isNaN(sinceDate.getTime())) {
          newCount = await this.prismaService.recipe.count({
            where: {
              ...baseWhere,
              createdAt: { gt: sinceDate },
            },
          });
        }
      } catch {}
    }

    return {
      recipes: formattedRecipes,
      pageInfo: {
        limit,
        nextCursor,
        hasMore: (decodedCursor ? candidates.length >= candidateTake : formattedRecipes.length === limit) && !!nextCursor,
        ...(newCount !== undefined ? { newCount } : {}),
      },
    };
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
      const bucketName = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'recipe-images';
      const uploadPromises = files.map(async (file) => {
        const path = `recipes/${userId}/steps/${Date.now()}_${file.originalname}`;
        const data = await this.supabaseService.uploadFile(bucketName, path, file.buffer, file.mimetype);
        const publicUrl = this.supabaseService.getPublicUrl(bucketName, data.path);
        return publicUrl;
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
      const bucketName = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'recipe-images';
      const path = `recipes/${userId}/thumbnails/${Date.now()}_${file.originalname}`;
      const data = await this.supabaseService.uploadFile(bucketName, path, file.buffer, file.mimetype);
      const publicUrl = this.supabaseService.getPublicUrl(bucketName, data.path);

      // 기존 대표 이미지가 있으면 삭제 (URL에서 스토리지 경로 추출)
      if (recipe.thumbnailImage) {
        const existingPath = this.extractStoragePathFromPublicUrl(recipe.thumbnailImage, bucketName);
        if (existingPath) {
          await this.supabaseService.deleteFile(bucketName, [existingPath]);
        }
      }

      // DB 업데이트
      await this.prismaService.recipe.update({
        where: { id },
        data: { thumbnailImage: publicUrl },
      });

      return {
        success: true,
        message: '대표 이미지가 업로드되었습니다.',
        thumbnailUrl: publicUrl,
      };
    } catch (error) {
      throw new BadRequestException('대표 이미지 업로드에 실패했습니다.');
    }
  }

  // 단일 스텝 이미지 업로드 (Flutter 편의용)
  async uploadStepImage(file: Express.Multer.File, userId: string) {
    try {
      const bucketName = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'recipe-images';
      const path = `recipes/${userId}/steps/${Date.now()}_${file.originalname}`;
      const data = await this.supabaseService.uploadFile(bucketName, path, file.buffer, file.mimetype);
      const publicUrl = this.supabaseService.getPublicUrl(bucketName, data.path);
      return { imageUrl: publicUrl };
    } catch (error) {
      throw new BadRequestException('스텝 이미지 업로드에 실패했습니다.');
    }
  }

  private extractStoragePathFromPublicUrl(publicUrl: string, bucketName: string): string | null {
    try {
      // 예: https://<proj>.supabase.co/storage/v1/object/public/<bucket>/<path>
      const marker = `/object/public/${bucketName}/`;
      const idx = publicUrl.indexOf(marker);
      if (idx === -1) return null;
      return publicUrl.substring(idx + marker.length);
    } catch {
      return null;
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