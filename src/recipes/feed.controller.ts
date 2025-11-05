import { Controller, Get, Query, UseGuards, Res, Headers } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RecipesService } from './recipes.service';
import { RecipeQueryDto } from './dto/recipes.dto';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import type { Response } from 'express';
import { createHash } from 'crypto';

@ApiTags('레시피')
@Controller('feed')
export class FeedController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: '레시피 피드 조회',
    description:
      '커서 기반 키셋 페이지네이션과 블렌디드 랭킹을 적용한 피드. 필터/토글 지원.',
  })
  @ApiQuery({ type: RecipeQueryDto })
  @ApiResponse({
    status: 200,
    description: '피드 조회 성공',
    schema: {
      example: {
        recipes: [
          {
            id: 'uuid',
            title: '레몬 고소 부타',
            description: '일본식 고소한 돼지고기',
            ingredients: '돼지고기 200g\n간장 2T\n마늘',
            cookingTime: 30,
            servings: 2,
            difficulty: 'EASY',
            status: 'PUBLISHED',
            viewCount: 10,
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            author: {
              id: 'uuid',
              nickname: '요리사',
              profileImage: 'https://example.com/profile.jpg',
            },
            tags: [{ name: '오사카 요리', emoji: '🇯🇵' }],
            steps: [
              {
                order: 1,
                description: '팬에 돼지고기를 볶는다',
                imageUrl: 'https://example.com/step1.jpg',
              },
            ],
            likesCount: 5,
            commentsCount: 3,
            isLiked: false,
            isSaved: false,
          },
        ],
        pageInfo: {
          limit: 10,
          nextCursor: 'cmVjaXBlX2lkOjEyMy0uLi4=',
          hasMore: true,
          newCount: 3,
        },
      },
    },
  })
  async getFeed(@Query() query: RecipeQueryDto, @CurrentUser() user?: any, @Res({ passthrough: true }) res?: Response, @Headers('if-none-match') inm?: string) {
    const data = await this.recipesService.getFeed(query, user?.id);
    if (!user) {
      const etag = 'W/"' + createHash('sha1').update(JSON.stringify(data)).digest('hex') + '"';
      res!.setHeader('ETag', etag);
      res!.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=300');
      if (inm && inm === etag) {
        res!.status(304).end();
        return undefined as any;
      }
    } else {
      res!.setHeader('Cache-Control', 'private, max-age=0, no-store');
    }
    return data as any;
  }

  @Get('popular')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '인기 레시피', description: '최근 조회수/참여 기반 인기 레시피' })
  @ApiQuery({ type: RecipeQueryDto })
  async getPopular(@Query() query: RecipeQueryDto, @CurrentUser() user?: any, @Res({ passthrough: true }) res?: Response, @Headers('if-none-match') inm?: string) {
    const data = await this.recipesService.getPopularRecipes(query, user?.id);
    if (!user) {
      const etag = 'W/"' + createHash('sha1').update(JSON.stringify(data)).digest('hex') + '"';
      res!.setHeader('ETag', etag);
      res!.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=300');
      if (inm && inm === etag) {
        res!.status(304).end();
        return undefined as any;
      }
    } else {
      res!.setHeader('Cache-Control', 'private, max-age=0, no-store');
    }
    return data as any;
  }

  @Get('recommended')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '추천 레시피', description: '개인화된 휴리스틱 추천 레시피' })
  @ApiQuery({ type: RecipeQueryDto })
  async getRecommended(@Query() query: RecipeQueryDto, @CurrentUser() user?: any, @Res({ passthrough: true }) res?: Response, @Headers('if-none-match') inm?: string) {
    const data = await this.recipesService.getRecommendedRecipes(query, user?.id);
    if (!user) {
      const etag = 'W/"' + createHash('sha1').update(JSON.stringify(data)).digest('hex') + '"';
      res!.setHeader('ETag', etag);
      res!.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=300');
      if (inm && inm === etag) {
        res!.status(304).end();
        return undefined as any;
      }
    } else {
      res!.setHeader('Cache-Control', 'private, max-age=0, no-store');
    }
    return data as any;
  }
}


