import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { randomBytes } from 'crypto';

export interface TokenPayload {
  sub: string; // 사용자 ID
  email: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class TokenService {
  private readonly ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15분
  private readonly REFRESH_TOKEN_EXPIRES_IN_DAYS = 30; // 30일

  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  /**
   * Access Token과 Refresh Token 쌍 생성
   */
  async generateTokenPair(userId: string, email: string): Promise<TokenPair> {
    const payload: TokenPayload = { sub: userId, email };
    
    // Access Token 생성 (짧은 만료시간)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    });

    // Refresh Token 생성 (긴 만료시간)
    const refreshToken = this.generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRES_IN_DAYS);

    // 기존 리프레시 토큰들 무효화 (보안 강화)
    await this.revokeUserRefreshTokens(userId);

    // 새 리프레시 토큰 저장
    await this.prismaService.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15분을 초로 변환
    };
  }

  /**
   * Refresh Token으로 새 토큰 쌍 생성 (Token Rotation)
   */
  async refreshTokenPair(refreshToken: string): Promise<TokenPair> {
    // 리프레시 토큰 검증
    const storedToken = await this.prismaService.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }

    if ((storedToken.user as any).status !== 'ACTIVE') {
      throw new UnauthorizedException('비활성화된 사용자입니다.');
    }

    // 사용된 리프레시 토큰 무효화 (Token Rotation)
    await this.prismaService.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // 새 토큰 쌍 생성
    return this.generateTokenPair(storedToken.user.id, storedToken.user.email);
  }

  /**
   * 사용자의 모든 리프레시 토큰 무효화 (로그아웃)
   */
  async revokeUserRefreshTokens(userId: string): Promise<void> {
    await this.prismaService.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  /**
   * 특정 리프레시 토큰 무효화
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.prismaService.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });
  }

  /**
   * 만료된 리프레시 토큰 정리 (백그라운드 작업)
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.prismaService.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true },
        ],
      },
    });
  }

  /**
   * 안전한 랜덤 리프레시 토큰 생성
   */
  private generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  /**
   * Access Token 검증
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 액세스 토큰입니다.');
    }
  }
} 