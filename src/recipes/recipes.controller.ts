import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto, UpdateRecipeDto, RecipeQueryDto } from './dto/recipes.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('레시피')
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '레시피 생성' })
  @ApiResponse({ status: 201, description: '레시피가 성공적으로 생성되었습니다.' })
  async create(@CurrentUser() user: any, @Body() createRecipeDto: CreateRecipeDto) {
    return this.recipesService.create(user.id, createRecipeDto);
  }

  @Get()
  @ApiOperation({ summary: '레시피 목록 조회' })
  @ApiQuery({ type: RecipeQueryDto })
  @ApiResponse({ status: 200, description: '레시피 목록 조회 성공' })
  async findAll(@Query() query: RecipeQueryDto, @CurrentUser() user?: any) {
    return this.recipesService.findAll(query, user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '레시피 상세 조회' })
  @ApiParam({ name: 'id', description: '레시피 ID' })
  @ApiResponse({ status: 200, description: '레시피 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '레시피를 찾을 수 없음' })
  async findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.recipesService.findOne(id, user?.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '레시피 수정' })
  @ApiParam({ name: 'id', description: '레시피 ID' })
  @ApiResponse({ status: 200, description: '레시피가 성공적으로 수정되었습니다.' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '레시피를 찾을 수 없음' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateRecipeDto: UpdateRecipeDto,
  ) {
    return this.recipesService.update(id, user.id, updateRecipeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '레시피 삭제' })
  @ApiParam({ name: 'id', description: '레시피 ID' })
  @ApiResponse({ status: 200, description: '레시피가 성공적으로 삭제되었습니다.' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '레시피를 찾을 수 없음' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.recipesService.remove(id, user.id);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FilesInterceptor('files', 5))
  @ApiOperation({ summary: '레시피 이미지 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: '레시피 ID' })
  @ApiResponse({ status: 200, description: '이미지가 성공적으로 업로드되었습니다.' })
  async uploadImages(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.recipesService.uploadImages(id, user.id, files);
  }
} 