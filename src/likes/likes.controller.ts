import { Controller, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('좋아요')
@Controller('recipes/:recipeId/like')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @ApiOperation({ summary: '좋아요 토글' })
  @ApiResponse({ status: 200, description: '좋아요 상태가 변경되었습니다.' })
  async toggleLike(@Param('recipeId') recipeId: string, @CurrentUser() user: any) {
    return this.likesService.toggleLike(user.id, recipeId);
  }
} 