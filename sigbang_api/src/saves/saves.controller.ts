import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SavesService } from './saves.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('저장')
@Controller('recipes/:recipeId/save')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SavesController {
  constructor(private readonly savesService: SavesService) {}

  @Post()
  @ApiOperation({ summary: '레시피 저장 토글' })
  @ApiResponse({ status: 200, description: '저장 상태가 변경되었습니다.' })
  async toggleSave(@Param('recipeId') recipeId: string, @CurrentUser() user: any) {
    return this.savesService.toggleSave(user.id, recipeId);
  }
} 