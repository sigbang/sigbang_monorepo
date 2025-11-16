import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { SesMailService } from '../common/services/ses-mail.service';

@Module({
  controllers: [FeedbackController],
  providers: [FeedbackService, SesMailService],
})
export class FeedbackModule {}


