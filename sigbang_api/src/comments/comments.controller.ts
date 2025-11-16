import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('댓글')
@Controller('recipes/:recipeId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '댓글 작성' })
  async create(
    @Param('recipeId') recipeId: string,
    @Body('content') content: string,
    @CurrentUser() user: any,
  ) {
    return this.commentsService.create(user.id, recipeId, content);
  }

  @Get()
  @ApiOperation({ summary: '댓글 목록 조회' })
  async findAll(@Param('recipeId') recipeId: string) {
    return this.commentsService.findByRecipe(recipeId);
  }

  @Delete(':commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '댓글 삭제' })
  async remove(@Param('commentId') commentId: string, @CurrentUser() user: any) {
    return this.commentsService.remove(commentId, user.id);
  }
} 