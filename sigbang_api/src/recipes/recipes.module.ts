import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { FeedController } from './feed.controller';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../database/supabase.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [RecipesController, FeedController],
  providers: [RecipesService, PrismaService, SupabaseService],
  exports: [RecipesService],
})
export class RecipesModule {} 