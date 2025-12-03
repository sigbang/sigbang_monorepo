import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LogClickDto, LogImpressionsDto } from './dto/reco-events.dto';

@Injectable()
export class RecoEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async logImpressions(dto: LogImpressionsDto, userId?: string, anonId?: string) {
    const items = Array.isArray(dto.items) ? dto.items : [];
    if (!items.length) return { ok: true, count: 0 };
    const rows = items.map(i => ({
      userId: userId ?? null,
      anonId: anonId ?? null,
      sessionId: dto.sessionId ?? null,
      surface: dto.surface,
      type: 'impression',
      recipeId: i.recipeId,
      position: i.position ?? null,
      rankScore: i.rankScore != null ? (this.prisma as any).Decimal ? new (this.prisma as any).Decimal(i.rankScore) : i.rankScore : null,
      expId: dto.expId ?? null,
      expVariant: dto.expVariant ?? null,
      seed: dto.seed ?? null,
      cursor: dto.cursor ?? null,
    }));
    await (this.prisma as any).recommendationEvent.createMany({ data: rows });
    return { ok: true, count: rows.length };
  }

  async logClick(dto: LogClickDto, userId?: string, anonId?: string) {
    await (this.prisma as any).recommendationEvent.create({
      data: {
        userId: userId ?? null,
        anonId: anonId ?? null,
        sessionId: dto.sessionId ?? null,
        surface: dto.surface,
        type: 'click',
        recipeId: dto.recipeId,
        position: dto.position ?? null,
        rankScore: dto.rankScore != null ? (this.prisma as any).Decimal ? new (this.prisma as any).Decimal(dto.rankScore) : dto.rankScore : null,
        expId: dto.expId ?? null,
        expVariant: dto.expVariant ?? null,
        seed: dto.seed ?? null,
      },
    });
    return { ok: true };
  }
}


