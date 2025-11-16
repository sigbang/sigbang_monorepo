import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TrendCronService } from './trend-cron.service';
import { CleanupCronService } from './cleanup-cron.service';
import { TrendCronController } from './trend-cron.controller';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../database/supabase.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [TrendCronService, CleanupCronService, PrismaService, SupabaseService],
  controllers: [TrendCronController],
})
export class TrendCronModule {}


