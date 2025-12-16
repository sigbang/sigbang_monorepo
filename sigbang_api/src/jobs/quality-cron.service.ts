import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { RecipesService } from '../recipes/recipes.service';

@Injectable()
export class QualityCronService {
  private readonly logger = new Logger(QualityCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly recipesService: RecipesService,
  ) {}

  // 10분마다 최대 50개씩 품질 점수 백필
  @Cron(CronExpression.EVERY_10_MINUTES)
  async backfillRecipeQuality() {
    const t0 = Date.now();
    const batchSize = 50;

    const targets = await this.prisma.recipe.findMany({
      where: {
        status: 'PUBLISHED',
        isHidden: false,
        aiQualityUpdatedAt: null,
      },
      take: batchSize,
      orderBy: { createdAt: 'asc' },
      include: {
        steps: {
          select: { description: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!targets.length) {
      return;
    }

    this.logger.log(`backfillRecipeQuality start count=${targets.length}`);

    for (const r of targets) {
      try {
        const score = await (this.recipesService as any).evaluateRecipeQuality({
          title: r.title,
          description: r.description,
          ingredients: r.ingredients,
          steps: r.steps,
        });

        await this.prisma.recipe.update({
          where: { id: r.id },
          data: {
            aiQualityScore: score,
            aiQualityUpdatedAt: new Date(),
          },
        });
      } catch (e: any) {
        this.logger.error(
          `evaluate quality failed id=${r.id}: ${String(e?.message || e)}`,
        );
      }
    }

    this.logger.log(
      `backfillRecipeQuality done count=${targets.length} in ${Date.now() - t0}ms`,
    );
  }
}

