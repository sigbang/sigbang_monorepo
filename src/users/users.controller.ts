import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateUserDto, UserResponseDto, UsersRecipesQueryDto } from './dto/users.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt.guard';
import { UsersFollowsQueryDto } from './dto/users.dto';

@ApiTags('사용자')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('me')
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 조회 성공',
    type: UserResponseDto,
  })
  async getMe(@CurrentUser() user: any) {
    return this.usersService.findMe(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('me/history')
  @ApiOperation({ summary: '내 계정 히스토리 조회' })
  @ApiResponse({ status: 200, description: '히스토리 조회 성공' })
  async getMyHistory(@CurrentUser() user: any, @Query('limit') limit?: number, @Query('cursor') cursor?: string) {
    return (this.usersService as any).getUserHistory(user.id, { limit, cursor }, true);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch('me')
  @ApiOperation({ summary: '내 정보 수정' })
  @ApiResponse({
    status: 200,
    description: '프로필 업데이트 성공',
    schema: {
      example: {
        message: '프로필이 성공적으로 업데이트되었습니다.',
        user: {
          id: 'uuid',
          email: 'user@example.com',
          nickname: '새로운닉네임',
          profileImage: null,
          bio: '새로운 소개',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 409, description: '이미 사용 중인 닉네임' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('me/profile-image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '프로필 이미지 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: '프로필 이미지 업로드 성공',
    schema: {
      example: {
        message: '프로필 이미지가 성공적으로 업로드되었습니다.',
        user: {
          id: 'uuid',
          email: 'user@example.com',
          nickname: '닉네임',
          profileImage: 'https://example.com/profile.jpg',
          bio: '소개',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      },
    },
  })
  async uploadProfileImage(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadProfileImage(user.id, file);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete('me')
  @ApiOperation({ summary: '계정 탈퇴' })
  @ApiResponse({
    status: 200,
    description: '계정 탈퇴 성공',
    schema: {
      example: {
        message: '계정이 성공적으로 탈퇴되었습니다.',
      },
    },
  })
  async deleteAccount(@CurrentUser() user: any) {
    return this.usersService.deleteAccount(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('me/recipes')
  @ApiOperation({ summary: '내 레시피 목록 조회' })
  @ApiQuery({ type: UsersRecipesQueryDto })
  @ApiResponse({
    status: 200,
    description: '사용자 레시피 목록 조회 성공',
  })
  async getMyRecipes(@CurrentUser() user: any, @Query() query: UsersRecipesQueryDto) {
    return (this.usersService as any).getUserRecipes(user.id, user.id, query);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('me/saved-recipes')
  @ApiOperation({ summary: '저장한 레시피 목록 조회' })
  @ApiQuery({ type: UsersRecipesQueryDto })
  @ApiResponse({
    status: 200,
    description: '저장한 레시피 목록 조회 성공',
  })
  async getMySavedRecipes(@CurrentUser() user: any, @Query() query: UsersRecipesQueryDto) {
    return (this.usersService as any).getUserSavedRecipes(user.id, query);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @ApiOperation({ summary: '다른 사용자 정보 조회' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 조회 성공',
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async getUserById(@Param('id') userId: string, @CurrentUser() viewer?: any) {
    return (this.usersService as any).findUserById(userId, viewer?.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id/history')
  @ApiOperation({ summary: '사용자 히스토리 조회(운영자용)' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '히스토리 조회 성공' })
  async getUserHistory(@Param('id') userId: string, @CurrentUser() currentUser: any, @Query('limit') limit?: number, @Query('cursor') cursor?: string) {
    // 운영자 권한 가드에서 검증됨
    return (this.usersService as any).getUserHistory(userId, { limit, cursor }, false);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id/recipes')
  @ApiOperation({ summary: '다른 사용자의 레시피 목록 조회' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiQuery({ type: UsersRecipesQueryDto })
  @ApiResponse({
    status: 200,
    description: '사용자 레시피 목록 조회 성공',
  })
  async getUserRecipes(
    @Param('id') userId: string,
    @CurrentUser() currentUser: any,
    @Query() query: UsersRecipesQueryDto,
  ) {
    return (this.usersService as any).getUserRecipes(userId, currentUser?.id, query);
  }

  @Get(':id/follow-counts')
  @ApiOperation({ summary: '사용자의 팔로워/팔로잉 카운트 조회' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({
    status: 200,
    description: '팔로워/팔로잉 카운트 조회 성공',
    schema: {
      example: {
        followerCount: 123,
        followingCount: 45,
      },
    },
  })
  async getFollowCounts(@Param('id') userId: string) {
    return (this.usersService as any).getFollowCounts(userId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id/followers')
  @ApiOperation({ summary: '사용자의 팔로워 목록 조회' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiQuery({ type: UsersFollowsQueryDto })
  async getFollowers(
    @Param('id') userId: string,
    @CurrentUser() viewer: any,
    @Query() query: UsersFollowsQueryDto,
  ) {
    return (this.usersService as any).getFollowers(userId, viewer?.id, query);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id/followings')
  @ApiOperation({ summary: '사용자의 팔로잉 목록 조회' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiQuery({ type: UsersFollowsQueryDto })
  async getFollowings(
    @Param('id') userId: string,
    @CurrentUser() viewer: any,
    @Query() query: UsersFollowsQueryDto,
  ) {
    return (this.usersService as any).getFollowings(userId, viewer?.id, query);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post(':id/follow')
  @ApiOperation({ summary: '대상 사용자 팔로우' })
  async follow(@CurrentUser() user: any, @Param('id') targetUserId: string) {
    return (this.usersService as any).follow(user.id, targetUserId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id/follow')
  @ApiOperation({ summary: '대상 사용자 언팔로우' })
  async unfollow(@CurrentUser() user: any, @Param('id') targetUserId: string) {
    return (this.usersService as any).unfollow(user.id, targetUserId);
  }
} 