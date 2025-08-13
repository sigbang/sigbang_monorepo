import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { FeedController } from './feed.controller';

@Module({
  controllers: [RecipesController, FeedController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {} 