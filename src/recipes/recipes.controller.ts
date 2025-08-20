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
  BadRequestException,
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
  DraftRecipeResponseDto
} from './dto/recipes.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('레시피')
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

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
    @Param('id') id: string,
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
  async publish(@Param('id') id: string, @CurrentUser() user: any) {
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
  async getRecipe(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.recipesService.getRecipe(id, user?.id);
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
  async getFeed(@Query() query: RecipeQueryDto, @CurrentUser() user?: any) {
    return this.recipesService.getFeed(query, user?.id);
  }

  // 대표 이미지 업로드
  @Post(':id/thumbnail')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FilesInterceptor('file', 1))
  @ApiOperation({ 
    summary: '레시피 대표 이미지 업로드',
    description: '레시피의 대표 이미지(썸네일)를 업로드합니다.'
  })
  @ApiParam({ name: 'id', description: '레시피 ID' })
  @ApiConsumes('multipart/form-data')
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
    @Param('id') id: string,
    @CurrentUser() user: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }
    return this.recipesService.uploadThumbnail(id, user.id, files[0]);
  }

  // 추가: 이미지 업로드 (단계별 이미지용)
  @Post('images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FilesInterceptor('files', 10))
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: '단일 스텝 이미지 업로드',
    description: '요청 받은 파일을 Supabase Storage에 업로드하고 공개 URL을 반환합니다.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: '업로드 성공', schema: { example: { imageUrl: 'https://.../public/recipe-images/recipes/<userId>/steps/<file>.jpg' } } })
  @ApiResponse({ status: 400, description: '업로드 실패' })
  async uploadStepImage(
    @CurrentUser() user: any,
    @UploadedFiles() file: Express.Multer.File,
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
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.recipesService.remove(id, user.id);
  }
}