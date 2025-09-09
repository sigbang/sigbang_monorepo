import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TrendCronService } from './trend-cron.service';
import { TrendCronController } from './trend-cron.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [TrendCronService, PrismaService],
  controllers: [TrendCronController],
})
export class TrendCronModule {}


