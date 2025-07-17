import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('관리자')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('reports')
  @ApiOperation({ summary: '신고 목록 조회' })
  async getReports() {
    return this.adminService.getReports();
  }

  @Patch('recipes/:id/hide')
  @ApiOperation({ summary: '레시피 숨김 처리' })
  async hideRecipe(
    @Param('id') recipeId: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.adminService.hideRecipe(recipeId, user.id, reason);
  }

  @Patch('comments/:id/hide')
  @ApiOperation({ summary: '댓글 숨김 처리' })
  async hideComment(
    @Param('id') commentId: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.adminService.hideComment(commentId, user.id, reason);
  }

  @Patch('users/:id/block')
  @ApiOperation({ summary: '사용자 차단' })
  async blockUser(
    @Param('id') userId: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.adminService.blockUser(userId, user.id, reason);
  }
} 