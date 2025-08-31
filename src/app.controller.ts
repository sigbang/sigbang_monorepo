import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { PrismaService } from './database/prisma.service';

@ApiTags('Health Check')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: '헬스 체크' })
  @ApiResponse({ status: 200, description: '서버 상태 확인' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: '서버 상태 확인' })
  @ApiResponse({ status: 200, description: '서버가 정상적으로 작동 중' })
  async healthCheck() {
    let dbStatus = 'down';
    try {
      const db = await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'up';
    } catch (e) {
      dbStatus = 'down';
    }

    return {
      status: 'ok',
      db: dbStatus,
      timestamp: new Date().toISOString(),
      message: 'SigBang API is running successfully',
    };
  }
} 