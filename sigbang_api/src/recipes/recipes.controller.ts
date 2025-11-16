import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  BadRequestException,
  ParseUUIDPipe,
  Res,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { RecipesService } from './recipes.service';
import { 
  CreateRecipeDto, 
  UpdateRecipeDto, 
  RecipeQueryDto,
  RecipeResponseDto,
  DraftRecipeResponseDto,
  RecipeSearchQueryDto,
  RecipeSearchResponseDto,
  CropRectDto,
  NormalizeIngredientsDto,
  NormalizedIngredientsResponseDto,
} from './dto/recipes.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt.guard';
import { DegradeGuard } from '../common/guards/degrade.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { AiGenerateRecipeDto, AiRecipeGenerateResponseDto } from './dto/recipes.dto';
import type { Response } from 'express';
import { createHash } from 'crypto';

@ApiTags('레시피')
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  // 레시피 수정 (공개/임시 모두)
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '레시피 수정',
    description: '레시피 내용을 수정합니다. (작성자만 가능) 태그/단계/썸네일 업데이트 지원'
  })
  @ApiParam({ name: 'id', description: '레시피 ID' })
  @ApiBody({ type: UpdateRecipeDto })
  @ApiResponse({ status: 200, description: '레시피가 성공적으로 수정되었습니다.' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '레시피를 찾을 수 없음' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: any,
    @Body() updateRecipeDto: UpdateRecipeDto,
  ) {
    return this.recipesService.updateRecipe(id, user.id, updateRecipeDto);
  }

  // 임시 저장 제외: 바로 공개 등록
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '레시피 생성 (즉시 공개)' })
  @ApiBody({ type: CreateRecipeDto })
  @ApiResponse({ status: 201, description: '레시피 생성 성공' })
  async create(@CurrentUser() user: any, @Body() createRecipeDto: CreateRecipeDto) {    
    return this.recipesService.create(user.id, createRecipeDto);
  }

  // AI: 이미지 분석으로 레시피 초안 생성
  @Post('ai/generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'AI 이미지 분석 기반 레시피 생성',
    description: '클라이언트에서 presign 이미지 경로를 전달하면, 이미지를 분석해 레시피(제목/설명/재료/조리시간/조리순서)를 생성하여 반환합니다.',
  })
  @ApiBody({ type: AiGenerateRecipeDto })
  @ApiResponse({ status: 201, description: '성공', type: AiRecipeGenerateResponseDto })  
  async aiGenerate(
    @CurrentUser() user: any,
    @Body() body: AiGenerateRecipeDto,
  ): Promise<AiRecipeGenerateResponseDto> {
    return this.recipesService.generateFromImage(user.id, body);
  }

  // AI: 비정형 재료 텍스트 정규화
  @Post('ai/normalize-ingredients')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '비정형 재료 텍스트 정규화', description: '공공데이터 등에서 받은 비정형 재료 텍스트를 사람이 읽기 좋은 형식으로 변환합니다.' })
  @ApiBody({ type: NormalizeIngredientsDto })
  @ApiResponse({ status: 201, description: '성공', type: NormalizedIngredientsResponseDto })
  async normalizeIngredients(
    @Body() body: NormalizeIngredientsDto,
  ): Promise<NormalizedIngredientsResponseDto> {
    return this.recipesService.normalizeIngredients(body.raw, body.locale ?? 'ko');
  }

  // 1. 레시피 임시 저장 생성 (기존 임시 저장 전부 제거 후 새로 생성)
  @Post('draft')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '레시피 임시 저장 생성',
    description: '해당 유저의 기존 임시 저장을 모두 삭제한 후, 새로운 임시 저장을 생성합니다.'
  })
  @ApiBody({ type: CreateRecipeDto })
  @ApiResponse({ 
    status: 201, 
    description: '레시피가 성공적으로 임시 저장되었습니다.',
    schema: {
      example: {
        success: true,
        message: '레시피가 임시 저장되었습니다.',
        data: {
          id: 'uuid',
          title: '레몬 고소 부타',
          status: 'DRAFT',
          createdAt: '2023-01-01T00:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async createDraft(@CurrentUser() user: any, @Body() createRecipeDto: CreateRecipeDto) {
    return this.recipesService.createDraft(user.id, createRecipeDto);
  }

  // 2. 레시피 임시 저장 수정
  @Put('draft/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '레시피 임시 저장 수정',
    description: '기존 임시저장된 레시피를 수정합니다.'
  })
  @ApiParam({ name: 'id', description: '레시피 ID' })
  @ApiBody({ type: UpdateRecipeDto })
  @ApiResponse({ 
    status: 200, 
    description: '레시피가 성공적으로 수정되었습니다.',
    schema: {
      example: {
        success: true,
        message: '레시피가 수정되었습니다.',
        data: {
          id: 'uuid',
          title: '레몬 고소 부타',
          status: 'DRAFT',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '레시피를 찾을 수 없음' })
  async updateDraft(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: any,
    @Body() updateRecipeDto: UpdateRecipeDto,
  ) {
    return this.recipesService.updateDraft(id, user.id, updateRecipeDto);
  }

  // 3. 레시피 공개
  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '레시피 공개',
    description: '임시저장된 레시피를 공개 상태로 변경합니다.'
  })
  @ApiParam({ name: 'id', description: '레시피 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '레시피가 성공적으로 공개되었습니다.',
    schema: {
      example: {
        success: true,
        message: '레시피가 공개되었습니다.',
        data: {
          id: 'uuid',
          title: '레몬 고소 부타',
          status: 'PUBLISHED',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 (최소 요구사항 미충족 등)' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '레시피를 찾을 수 없음' })
  async publish(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @CurrentUser() user: any) {
    return this.recipesService.publish(id, user.id);
  }

  // 4. 내 임시 저장 단건 조회 (유저당 1개)
  @Get('draft')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '내 임시 저장 조회',
    description: '현재 사용자의 임시 저장된 레시피를 조회합니다. 없으면 null 반환.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '임시 저장 조회 성공',
    schema: {
      example: {
        id: 'uuid',
        title: '레몬 고소 부타',
        description: '일본식 고소한 돼지고기',
        status: 'DRAFT',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }
    }
  })
  async getDraft(@CurrentUser() user: any) {
    return this.recipesService.getDraft(user.id);
  }

  // 내 임시 저장 수정 (id 없이 현재 사용자 기준)
  @Put('draft')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '내 임시 저장 수정',
    description: '현재 사용자의 단 하나의 임시 저장 레시피를 수정합니다.'
  })
  @ApiBody({ type: UpdateRecipeDto })
  @ApiResponse({ status: 200, description: '임시 저장 수정 성공' })
  async updateMyDraft(
    @CurrentUser() user: any,
    @Body() updateRecipeDto: UpdateRecipeDto,
  ) {
    return this.recipesService.updateMyDraft(user.id, updateRecipeDto);
  }

  // 6. 피드 조회 (공개된 레시피만)
  @Get('/feed')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ 
    summary: '레시피 피드 조회',
    description: '커서 기반 키셋 페이지네이션과 블렌디드 랭킹을 적용한 피드. 필터/토글 지원.'
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
              profileImage: 'https://example.com/profile.jpg'
            },
            tags: [
              { name: '오사카 요리', emoji: '🇯🇵' }
            ],
            steps: [
              {
                order: 1,
                description: '팬에 돼지고기를 볶는다',
                imageUrl: 'https://example.com/step1.jpg'
              }
            ],
            likesCount: 5,
            commentsCount: 3,
            isLiked: false,
            isSaved: false
          }
        ],
        pageInfo: {
          limit: 10,
          nextCursor: 'cmVjaXBlX2lkOjEyMy0uLi4=',
          hasMore: true,
          newCount: 3
        }
      }
    }
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

  // 7. 검색 API (q 없으면 트렌드 피드)
  @Get('search')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '레시피 검색 (TRGM + 트렌드 혼합)' })
  @ApiQuery({ name: 'q', required: false, description: '검색어. 없으면 큐레이션 피드' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 크기(기본 20)' })
  @ApiQuery({ name: 'cursor', required: false, description: '키셋 커서 Base64({score,id})' })
  @ApiResponse({ status: 200, description: '검색 결과', type: Object })
  async search(@Query() query: RecipeSearchQueryDto, @CurrentUser() user?: any, @Res({ passthrough: true }) res?: Response, @Headers('if-none-match') inm?: string): Promise<RecipeSearchResponseDto> {
    const data = await this.recipesService.search(query, user?.id);
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

  // 5. 레시피 상세 조회
  @Get('by-slug/:region/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '레시피 상세 조회 (slug)' })
  @ApiParam({ name: 'region', description: '지역/카테고리 슬러그 (예: korea, japan, fusion)' })
  @ApiParam({ name: 'slug', description: '레시피 제목 기반 슬러그' })
  @ApiResponse({ status: 200, description: '레시피 상세 조회 성공', type: RecipeResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음 (비공개 레시피)' })
  @ApiResponse({ status: 404, description: '레시피를 찾을 수 없음' })
  async getRecipeBySlug(
    @Param('region') region: string,
    @Param('slug') slug: string,
    @CurrentUser() user?: any,
    @Res({ passthrough: true }) res?: Response,
    @Headers('if-none-match') inm?: string,
  ) {
    const slugPath = `${region}/${slug}`;
    const data = await this.recipesService.getRecipeBySlug(slugPath, user?.id);
    const cacheCtl = user ? 'private, max-age=0, no-store' : 'public, max-age=60, stale-while-revalidate=300';
    res!.setHeader('Cache-Control', cacheCtl);
    if (!user) {
      const etag = 'W/"' + createHash('sha1').update(JSON.stringify(data)).digest('hex') + '"';
      res!.setHeader('ETag', etag);
      if (inm && inm === etag) {
        res!.status(304).end();
        return undefined as any;
      }
    }
    return data;
  }

  // 단일 세그먼트 슬러그 지원 (region 없이 저장된 slug 대응)
  @Get('by-slug/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '레시피 상세 조회 (단일 슬러그)' })
  @ApiParam({ name: 'slug', description: '레시피 제목 기반 단일 슬러그' })
  @ApiResponse({ status: 200, description: '레시피 상세 조회 성공', type: RecipeResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음 (비공개 레시피)' })
  @ApiResponse({ status: 404, description: '레시피를 찾을 수 없음' })
  async getRecipeBySingleSlug(
    @Param('slug') slug: string,
    @CurrentUser() user?: any,
    @Res({ passthrough: true }) res?: Response,
    @Headers('if-none-match') inm?: string,
  ) {
    const data = await this.recipesService.getRecipeBySlug(slug, user?.id);
    const cacheCtl = user ? 'private, max-age=0, no-store' : 'public, max-age=60, stale-while-revalidate=300';
    res!.setHeader('Cache-Control', cacheCtl);
    if (!user) {
      const etag = 'W/"' + createHash('sha1').update(JSON.stringify(data)).digest('hex') + '"';
      res!.setHeader('ETag', etag);
      if (inm && inm === etag) {
        res!.status(304).end();
        return undefined as any;
      }
    }
    return data;
  }

  // UUID → slug 조회 (리다이렉트 전용 경량 엔드포인트)
  @Get(':id/slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '레시피 slug 조회 (리다이렉트용)' })
  @ApiParam({ name: 'id', description: '레시피 ID(UUID)' })
  @ApiResponse({ status: 200, description: '성공', schema: { example: { slug: 'korea/bulgogi-rice-bowl' } } })
  async getRecipeSlug(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user?: any,
  ) {
    return this.recipesService.getRecipeSlug(id, user?.id);
  }

  // 간단한 sitemap.xml (recipes 전용)
  @Get('sitemap.xml')
  @ApiOperation({ summary: '레시피 전용 sitemap.xml' })
  @ApiResponse({ status: 200, description: 'XML' })
  async getRecipesSitemap(@Res() res: Response) {
    const baseUrl = process.env.PUBLIC_BASE_URL || 'https://sigbang.com';
    const xml = await this.recipesService.buildRecipesSitemapXml(baseUrl);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(xml);
  }

  // 5. 레시피 상세 조회
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ 
    summary: '레시피 상세 조회',
    description: '레시피의 전체 정보를 조회합니다. 공개된 레시피만 조회 가능하며, 본인의 글인 경우 임시저장도 조회 가능합니다.'
  })
  @ApiParam({ name: 'id', description: '레시피 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '레시피 상세 조회 성공',
    type: RecipeResponseDto
  })
  @ApiResponse({ status: 403, description: '권한 없음 (비공개 레시피)' })
  @ApiResponse({ status: 404, description: '레시피를 찾을 수 없음' })
  async getRecipe(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @CurrentUser() user?: any, @Res({ passthrough: true }) res?: Response, @Headers('if-none-match') inm?: string) {
    const data = await this.recipesService.getRecipe(id, user?.id);
    const cacheCtl = user ? 'private, max-age=0, no-store' : 'public, max-age=60, stale-while-revalidate=300';
    res!.setHeader('Cache-Control', cacheCtl);
    if (!user) {
      const etag = 'W/"' + createHash('sha1').update(JSON.stringify(data)).digest('hex') + '"';
      res!.setHeader('ETag', etag);
      if (inm && inm === etag) {
        res!.status(304).end();
        return undefined as any;
      }
    }
    return data;
  }

  // 대표 이미지 업로드
  @Post(':id/thumbnail')
  @UseGuards(DegradeGuard, JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FilesInterceptor('file', 1, { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiOperation({ 
    summary: '레시피 대표 이미지 업로드',
    description: '레시피의 대표 이미지(썸네일)를 업로드합니다.'
  })
  @ApiParam({ name: 'id', description: '레시피 ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: '선택적으로 크롭(percent)을 함께 전송할 수 있습니다.', schema: { example: { crop: { x: 10, y: 10, width: 80, height: 80 } } } })
  @ApiResponse({ 
    status: 200, 
    description: '대표 이미지가 성공적으로 업로드되었습니다.',
    schema: {
      example: {
        success: true,
        message: '대표 이미지가 업로드되었습니다.',
        thumbnailUrl: 'https://example.com/thumbnail.jpg'
      }
    }
  })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '레시피를 찾을 수 없음' })
  async uploadThumbnail(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('crop') crop?: CropRectDto,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }
    return this.recipesService.uploadThumbnail(id, user.id, files[0], crop);
  }

  // 추가: 이미지 업로드 (단계별 이미지용)
  @Post('images')
  @UseGuards(DegradeGuard, JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiOperation({ 
    summary: '레시피 이미지 업로드',
    description: '레시피용 이미지를 업로드합니다. 단계별 이미지 등에 사용할 수 있습니다.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 200, 
    description: '이미지가 성공적으로 업로드되었습니다.',
    schema: {
      example: {
        imageUrls: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg'
        ]
      }
    }
  })
  @ApiResponse({ status: 400, description: '이미지 업로드 실패' })
  async uploadImages(
    @CurrentUser() user: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.recipesService.uploadImages(files, user.id);
  }

  // Flutter 단일 스텝 이미지 업로드 (form-data: file)
  @Post('images/step')
  @UseGuards(DegradeGuard, JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiOperation({
    summary: '단일 스텝 이미지 업로드',
    description: '요청 받은 파일을 Supabase Storage에 업로드하고 공개 URL을 반환합니다.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: '업로드 성공', schema: { example: { imageUrl: 'https://.../public/recipes/recipes/<userId>/steps/<file>.jpg' } } })
  @ApiResponse({ status: 400, description: '업로드 실패' })
  async uploadStepImage(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }
    return this.recipesService.uploadStepImage(file, user.id);
  }

  // 추가: 레시피 삭제 (Soft Delete)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '레시피 삭제',
    description: '레시피를 삭제합니다. (Soft Delete)'
  })
  @ApiParam({ name: 'id', description: '레시피 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '레시피가 성공적으로 삭제되었습니다.',
    schema: {
      example: {
        success: true,
        message: '레시피가 삭제되었습니다.'
      }
    }
  })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '레시피를 찾을 수 없음' })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @CurrentUser() user: any) {
    return this.recipesService.remove(id, user.id);
  }
}