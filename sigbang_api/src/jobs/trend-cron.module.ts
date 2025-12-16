import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TrendCronService } from './trend-cron.service';
import { CleanupCronService } from './cleanup-cron.service';
import { TrendCronController } from './trend-cron.controller';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../database/supabase.service';
import { QualityCronService } from './quality-cron.service';
import { RecipesModule } from '../recipes/recipes.module';

@Module({
  imports: [ScheduleModule.forRoot(), RecipesModule],
  providers: [TrendCronService, CleanupCronService, QualityCronService, PrismaService, SupabaseService],
  controllers: [TrendCronController],
})
export class TrendCronModule {}


