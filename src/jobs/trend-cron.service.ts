import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TrendCronService {
  private readonly logger = new Logger(TrendCronService.name);
  constructor(private prisma: PrismaService) {}

  // 매 60분 실행 (요청: 60분 간격)
  @Cron(CronExpression.EVERY_HOUR)
  async refreshTrend() {
    this.logger.log('Refreshing counters + trendScore ...');
    await this.upsertCounters7d();
    await this.backfillMissingCounters();
    await this.updateTrendScore();
    this.logger.log('Done refreshing trend.');
  }

  private async upsertCounters7d() {
    // 7일 창 집계 업서트 (snake_case 테이블 이름 사용)
    await (this.prisma as any).$executeRaw`
      INSERT INTO recipe_counters ("recipeId","views7d","saves7d","likes7d","trendScore")
      SELECT
        e."recipeId",
        SUM((e.type='view')::int) FILTER (WHERE e."occurredAt" >= now() - interval '7 day') AS v7,
        SUM((e.type='save')::int) FILTER (WHERE e."occurredAt" >= now() - interval '7 day') AS s7,
        SUM((e.type='like')::int) FILTER (WHERE e."occurredAt" >= now() - interval '7 day') AS l7,
        COALESCE((SELECT "trendScore" FROM recipe_counters c2 WHERE c2."recipeId" = e."recipeId"), 0)
      FROM recipe_events e
      WHERE e."occurredAt" >= now() - interval '7 day'
      GROUP BY e."recipeId"
      ON CONFLICT ("recipeId") DO UPDATE SET
        "views7d" = EXCLUDED."views7d",
        "saves7d" = EXCLUDED."saves7d",
        "likes7d" = EXCLUDED."likes7d";
    `;
  }

  private async updateTrendScore() {
    // 트렌드 산식 업데이트 (로그스케일 + 에디토리얼 가점 + 신선도 감쇠)
    await (this.prisma as any).$executeRaw`
      UPDATE recipe_counters c
      SET "trendScore" = LEAST(
        5.0,
        0.5 * ln(1 + c."views7d")
        + 0.7 * ln(1 + c."saves7d")
        + 0.3 * ln(1 + c."likes7d")
        + COALESCE(eb.boost, 0)
        + GREATEST(0, 1.2 - EXTRACT(EPOCH FROM (now() - r."createdAt"))/3600.0/72.0)
      )
      FROM recipes r
      LEFT JOIN editorial_boosts eb
        ON eb."recipeId" = c."recipeId"
        AND (eb."expiresAt" IS NULL OR eb."expiresAt" > now())
      WHERE r.id = c."recipeId";
    `;
  }

  private async backfillMissingCounters() {
    // 공개 글 중 카운터가 없는 레코드 0값으로 백필
    await (this.prisma as any).$executeRaw`
      INSERT INTO recipe_counters ("recipeId","views7d","saves7d","likes7d","trendScore")
      SELECT r.id, 0, 0, 0, 0
      FROM recipes r
      LEFT JOIN recipe_counters c ON c."recipeId" = r.id
      WHERE r."status" = 'PUBLISHED' AND r."isHidden" = false AND c."recipeId" IS NULL;
    `;
  }
}


