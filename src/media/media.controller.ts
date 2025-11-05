import { Body, Controller, Get, Post, Query, Redirect, UseGuards, BadRequestException, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { PresignDto } from './dto/media.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import type { Response } from 'express';

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

  // Private 버킷 파일 접근용: 스토리지 경로를 받아 서명URL로 리다이렉트
  @Get('image')
  @ApiOperation({ summary: '스토리지 이미지 서명 URL 리다이렉트' })
  @ApiQuery({ name: 'path', required: true, description: 'Storage 파일 경로 (예: recipes/{userId}/thumbnails/xxx.webp)' })
  @ApiQuery({ name: 'expires', required: false, description: '만료(초). 기본 300, 최소 30, 최대 86400' })
  @Redirect(undefined, 302)
  async image(@Query('path') path: string, @Query('expires') expires?: string, @Res({ passthrough: true }) res?: Response) {
    if (!path) throw new BadRequestException('path is required');
    const ttl = Math.max(30, Math.min(86400, Number(expires) || 300));
    if (res) {
      res.setHeader('Cache-Control', `private, max-age=${ttl}`);
    }
    const url = await this.media.getSignedDownloadUrl(path, ttl);
    return { url };
  }
}


