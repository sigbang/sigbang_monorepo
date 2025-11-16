import { Controller, Post, Headers, ForbiddenException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrendCronService } from './trend-cron.service';

@ApiTags('Jobs')
@Controller('jobs/trend')
export class TrendCronController {
  constructor(private readonly trend: TrendCronService) {}

  @Post('refresh')
  @ApiOperation({ summary: '트렌드 집계/산식 수동 실행' })
  async refresh(@Headers('x-admin-secret') secret?: string) {
    const expected = process.env.ADMIN_JOB_SECRET;
    if (!expected || secret !== expected) {
      throw new ForbiddenException('forbidden');
    }
    await this.trend.refreshTrend();
    return { ok: true };
  }
}


