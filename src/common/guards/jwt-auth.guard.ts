import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../database/supabase.service';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private supabaseService: SupabaseService,
    private prismaService: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('토큰이 제공되지 않았습니다.');
    }

    try {
      // Supabase JWT 토큰 검증
      const supabaseUser = await this.supabaseService.verifyToken(token);
      
      if (!supabaseUser) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      // 데이터베이스에서 사용자 정보 조회
      const user = await this.prismaService.user.findUnique({
        where: { supabaseId: supabaseUser.id },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('사용자를 찾을 수 없거나 비활성화된 계정입니다.');
      }

      // 사용자 정보를 request 객체에 추가
      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('인증에 실패했습니다.');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
} 