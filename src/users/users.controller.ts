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
import { UpdateUserDto, UserResponseDto } from './dto/users.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('사용자')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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

  @Get('me/recipes')
  @ApiOperation({ summary: '내 레시피 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '사용자 레시피 목록 조회 성공',
  })
  async getMyRecipes(@CurrentUser() user: any) {
    return this.usersService.getUserRecipes(user.id, user.id);
  }

  @Get('me/saved-recipes')
  @ApiOperation({ summary: '저장한 레시피 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '저장한 레시피 목록 조회 성공',
  })
  async getMySavedRecipes(@CurrentUser() user: any) {
    return this.usersService.getUserSavedRecipes(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '다른 사용자 정보 조회' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 조회 성공',
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async getUserById(@Param('id') userId: string) {
    return this.usersService.findUserById(userId);
  }

  @Get(':id/recipes')
  @ApiOperation({ summary: '다른 사용자의 레시피 목록 조회' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({
    status: 200,
    description: '사용자 레시피 목록 조회 성공',
  })
  async getUserRecipes(
    @Param('id') userId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.getUserRecipes(userId, currentUser?.id);
  }
} 