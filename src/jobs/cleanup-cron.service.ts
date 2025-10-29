import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../database/supabase.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CleanupCronService {
  private readonly logger = new Logger(CleanupCronService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  // 매일 새벽 4시 실행
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async purgeHiddenRecipes() {
    const retentionDays = Number(this.config.get<string>('RECIPE_DELETE_RETENTION_DAYS') ?? '30');
    const bucketName = this.config.get<string>('SUPABASE_STORAGE_BUCKET') || 'recipes';
    const threshold = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    this.logger.log(`Purging hidden recipes older than ${retentionDays}d (before ${threshold.toISOString()})`);

    // 후보 조회: 숨김 + 업데이트가 오래된(삭제 시점 근사치) 레시피
    const candidates = await this.prisma.recipe.findMany({
      where: {
        isHidden: true,
        updatedAt: { lt: threshold },
      },
      select: {
        id: true,
        authorId: true,
        thumbnailImage: true,
        steps: { select: { imageUrl: true } },
      },
      take: 200, // 배치 처리
    });

    for (const recipe of candidates) {
      try {
        const paths: string[] = [];
        // 썸네일
        if (recipe.thumbnailImage) {
          const p = this.extractStoragePathFromPublicUrl(recipe.thumbnailImage, bucketName);
          if (p) paths.push(p);
        }
        // 단계 이미지
        for (const s of recipe.steps) {
          if (s.imageUrl) {
            const p = this.extractStoragePathFromPublicUrl(s.imageUrl, bucketName);
            if (p) paths.push(p);
          }
        }

        // 스토리지 삭제(최대 1000개/요청 제한 고려하여 배치 분할 가능)
        if (paths.length > 0) {
          try { await this.supabase.deleteFile(bucketName, paths); } catch (e) { this.logger.warn(`storage delete failed: ${recipe.id} ${String(e)}`); }
        }

        // 영구 삭제: 종속 테이블은 FK onDelete Cascade로 정리됨
        await this.prisma.recipe.delete({ where: { id: recipe.id } });

        this.logger.log(`Purged recipe ${recipe.id}`);
      } catch (e) {
        this.logger.error(`Purge failed for ${recipe.id}: ${String(e)}`);
      }
    }
  }

  private extractStoragePathFromPublicUrl(publicUrl: string, bucketName: string): string | null {
    try {
      const marker = `/object/public/${bucketName}/`;
      const idx = publicUrl.indexOf(marker);
      if (idx === -1) return null;
      return publicUrl.substring(idx + marker.length);
    } catch {
      return null;
    }
  }
}


