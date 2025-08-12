import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { PresignDto } from './dto/media.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('미디어')
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('presign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '이미지 PUT 업로드용 사전 서명 URL 발급' })
  @ApiBody({ type: PresignDto })
  async presign(@CurrentUser() user: any, @Body() dto: PresignDto) {
    const userId = user.id;
    return this.media.createUploadUrl(userId, dto);
  }
}


