import {
  Body,
  BadRequestException,
  Controller,
  Headers,
  Ip,
  Post,
  Req,
  UsePipes,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { MailAttachment } from '../common/services/ses-mail.service';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

@ApiTags('피드백')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @UseInterceptors(
    FilesInterceptor('attachments', 3, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }))
  async submit(
    @Body() dto: CreateFeedbackDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Ip() ip: string,
    @Req() req: any,
    @Headers('x-device-id') deviceId?: string,
    @Headers('x-device-name') deviceName?: string,
  ) {
    const attachments: MailAttachment[] = [];
    let totalBytes = 0;
    for (const f of files || []) {
      totalBytes += f.size || 0;
      attachments.push({
        filename: sanitizeFilename(f.originalname || 'attachment'),
        contentType: f.mimetype || 'application/octet-stream',
        content: f.buffer,
      });
    }
    // SES 전체 메일 10MB 제한(Base64 오버헤드 고려) → 안전하게 약 7MB로 제한
    if (totalBytes > 7 * 1024 * 1024) {
      throw new BadRequestException('첨부 파일 용량이 너무 큽니다(최대 약 7MB).');
    }

    return this.service.submit(
      dto,
      {
        ip,
        userAgent: req.headers['user-agent'],
        deviceId,
        deviceName,
        // userEmail: user?.email, // 로그인 연결 시 사용
      },
      attachments,
    );
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\- ]/g, '_');
}


