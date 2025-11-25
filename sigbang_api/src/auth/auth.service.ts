import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../database/supabase.service';
import { SignUpDto, SignInDto, RevokeSessionDto } from './dto/auth.dto';
import { OAuth2Client } from 'google-auth-library';
import { TokenService, TokenPair, DeviceContext } from './token.service';


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

@Injectable()
export class AuthService {

  private client = new OAuth2Client(GOOGLE_CLIENT_ID);

  constructor(
    private prismaService: PrismaService,
    private supabaseService: SupabaseService,
    private tokenService: TokenService,
  ) {}

  async signUp(signUpDto: SignUpDto, device?: DeviceContext) {
    const { email, password, nickname } = signUpDto;

    // 이메일 기준 기존 계정 조회 (재활성화 허용)
    const existingByEmail = await this.prismaService.user.findUnique({
      where: { email },
      select: { id: true, status: true, deletedAt: true, nickname: true, supabaseId: true },
    });

    if (existingByEmail) {
      // 탈퇴 계정 → 재활성화 플로우
      if ((existingByEmail as any).status === 'DELETED') {
        // Supabase 계정 동기화(비밀번호 갱신 또는 신규 생성)
        try {
          if (existingByEmail.supabaseId) {
            const { error } = await this.supabaseService.getServiceClient().auth.admin.updateUserById(
              existingByEmail.supabaseId,
              { password },
            );
            if (error) {
              console.warn('Supabase 비밀번호 갱신 실패, 계속 진행:', error.message);
            }
          } else {
            const { data, error } = await this.supabaseService.getServiceClient().auth.admin.createUser({
              email,
              password,
              email_confirm: true,
            });
            if (error) {
              console.warn('Supabase 계정 생성 실패, 계속 진행:', error.message);
            } else {
              await this.prismaService.user.update({ where: { id: existingByEmail.id }, data: { supabaseId: (data as any).user.id } });
            }
          }
        } catch (error) {
          console.warn('Supabase 동기화 오류, 계속 진행:', error);
        }

        // 닉네임 변경 요청은 중복 허용 (이력은 프로필 수정 시 기록)

        const reactivated = await this.prismaService.user.update({
          where: { id: existingByEmail.id },
          data: { status: 'ACTIVE' as any, deletedAt: null, ...(nickname ? { nickname } : {}) },
        });

        // Fresh start: 관계/세션 초기화 (좋아요/저장/팔로우/토큰)
        await this.prismaService.$transaction(async (tx) => {
          await tx.like.deleteMany({ where: { userId: reactivated.id } });
          await tx.save.deleteMany({ where: { userId: reactivated.id } });
          await tx.follow.deleteMany({ where: { OR: [{ followerId: reactivated.id }, { followingId: reactivated.id }] } });
          await tx.refreshToken.deleteMany({ where: { userId: reactivated.id } });
        });

        // 이벤트 로그: REACTIVATE
        await (this.prismaService as any).userLifecycleEvent.create({
          data: {
            userId: reactivated.id,
            type: 'REACTIVATE',
            actorType: 'USER',
            actorId: reactivated.id,
            prevStatus: 'DELETED',
            nextStatus: 'ACTIVE',
            source: 'email',
          },
        });

        const tokens = await this.tokenService.generateTokenPair(reactivated.id, email, device);
        return {
          message: '계정이 재활성화되었습니다.',
          ...tokens,
          user: { id: reactivated.id, email, nickname: reactivated.nickname },
        };
      }

      // 기존 활성/정지 계정이면 가입 불가
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    // 신규 가입 경로: 닉네임 중복 허용
    try {
      // Supabase Auth로 사용자 생성
      const { data, error } = await this.supabaseService
        .getServiceClient()
        .auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      if (error) {
        throw new ConflictException('회원가입에 실패했습니다: ' + error.message);
      }

      // 프리셋 프로필 이미지에서 랜덤 선택 (best-effort)
      let profileUrl: string | undefined;
      try {
        const bucketName = 'recipes';
        const presetDir = 'profiles/presets';
        const rows = await this.supabaseService.listFiles(bucketName, presetDir);
        const files = (rows as any[]).filter((r) => r.name && !String(r.name).endsWith('/'));
        if (files.length) {
          const pick = files[Math.floor(Math.random() * files.length)];
          profileUrl = this.supabaseService.getPublicUrl(bucketName, `${presetDir}/${pick.name}`);
        }
      } catch {}

      // 데이터베이스에 사용자 정보 저장
      const user = await this.prismaService.user.create({
        data: {
          email,
          nickname,
          supabaseId: data.user.id,
          ...(profileUrl ? { profileImage: profileUrl } : {}),
        },
      });

      // 이벤트 로그: SIGN_UP
      await (this.prismaService as any).userLifecycleEvent.create({
        data: {
          userId: user.id,
          type: 'SIGN_UP',
          actorType: 'USER',
          actorId: user.id,
          nextStatus: 'ACTIVE',
          source: 'email',
        },
      });

      // JWT 토큰 쌍 생성 (즉시 로그인)
      const tokens = await this.tokenService.generateTokenPair(user.id, user.email, device);

      return {
        message: '회원가입이 완료되었습니다.',
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          profileImage: user.profileImage,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('회원가입 중 오류가 발생했습니다.');
    }
  }

  async signIn(signInDto: SignInDto, device?: DeviceContext) {
    const { email, password } = signInDto;

    try {
      // Supabase Auth로 로그인
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        throw new NotFoundException('이메일 또는 비밀번호가 잘못되었습니다.');
      }

      // 데이터베이스에서 사용자 정보 조회
      let user = await this.prismaService.user.findUnique({
        where: { supabaseId: data.user.id },
      });

      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      // DELETED 계정 자동 재활성화
      if ((user as any).status === 'DELETED') {
        user = await this.prismaService.user.update({
          where: { id: user.id },
          data: { status: 'ACTIVE' as any, deletedAt: null },
        });

        // Fresh start: 관계/세션 초기화
        try {
          await this.prismaService.$transaction(async (tx) => {
            await tx.like.deleteMany({ where: { userId: user.id } });
            await tx.save.deleteMany({ where: { userId: user.id } });
            await tx.follow.deleteMany({ where: { OR: [{ followerId: user.id }, { followingId: user.id }] } });
            await tx.refreshToken.deleteMany({ where: { userId: user.id } });
          });
        } catch {}

        // 이벤트 로그: REACTIVATE
        try {
          await (this.prismaService as any).userLifecycleEvent.create({
            data: {
              userId: user.id,
              type: 'REACTIVATE',
              actorType: 'USER',
              actorId: user.id,
              prevStatus: 'DELETED',
              nextStatus: 'ACTIVE',
              source: 'email',
            },
          });
        } catch {}
      }

      // SUSPENDED 계정은 여전히 거절
      if ((user as any).status !== 'ACTIVE') {
        throw new NotFoundException('비활성화된 계정입니다.');
      }

      // JWT 토큰 쌍 생성
      const tokens = await this.tokenService.generateTokenPair(user.id, user.email, device);

      // 이벤트 로그: LOGIN (best-effort)
      try {
        await (this.prismaService as any).userLifecycleEvent.create({
          data: { userId: user.id, type: 'LOGIN', actorType: 'USER', actorId: user.id, source: 'email' },
        });
      } catch {}

      return {
        message: '로그인 성공',
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          profileImage: user.profileImage,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('로그인 중 오류가 발생했습니다.');
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      return await this.tokenService.refreshTokenPair(refreshToken);
    } catch (error) {
      throw new UnauthorizedException('토큰 갱신에 실패했습니다.');
    }
  }

  async signOut(refreshToken: string) {
    try {
      await this.tokenService.revokeRefreshToken(refreshToken);
      // 이벤트 로그: LOGOUT (best-effort) - 토큰에서 유저를 구하기 어렵다면 생략 가능
      return { message: '로그아웃 되었습니다.' };
    } catch (error) {
      return { message: '로그아웃 처리 중 오류가 발생했습니다.' };
    }
  }

  async signOutAll(userId: string) {
    try {
      await this.tokenService.revokeUserRefreshTokens(userId);
      return { message: '모든 기기에서 로그아웃 되었습니다.' };
    } catch (error) {
      return { message: '로그아웃 처리 중 오류가 발생했습니다.' };
    }
  }

  async listSessions(userId: string) {
    return this.prismaService.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        userAgent: true,
        ip: true,
        isRevoked: true,
        createdAt: true,
        expiresAt: true,
        lastUsedAt: true,
      },
    });
  }

  async revokeSession(userId: string, dto: RevokeSessionDto) {
    const { tokenId, deviceId } = dto;
    if (!tokenId && !deviceId) {
      throw new UnauthorizedException('무효화할 세션 식별자가 필요합니다.');
    }
    await this.prismaService.refreshToken.updateMany({
      where: {
        userId,
        ...(tokenId ? { id: tokenId } : {}),
        ...(deviceId ? { deviceId } : {}),
        isRevoked: false,
      },
      data: { isRevoked: true },
    });
    return { message: '세션이 무효화되었습니다.' };
  }

  // 이메일 관련/비밀번호 재설정 관련 메서드 제거 (롤백)

  async validateGoogleUser(idToken: string, device?: DeviceContext) {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) throw new UnauthorizedException();

    // 유저 DB에 저장 또는 조회
    let user = await this.prismaService.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      user = await this.prismaService.user.create({
        data: {
          email: payload.email,
          nickname: payload.name || `사용자_${Date.now()}`, // name이 없을 경우 대체값
          profileImage: payload.picture || undefined,
          // Google OAuth 사용자는 supabaseId 없이 생성
        },
      });

      // 이벤트 로그: SIGN_UP(OAuth)
      try {
        await (this.prismaService as any).userLifecycleEvent.create({
          data: { userId: user.id, type: 'SIGN_UP', actorType: 'USER', actorId: user.id, nextStatus: 'ACTIVE', source: 'google-oauth' },
        });
      } catch {}

      // payload.picture가 없으면 프리셋에서 랜덤으로 설정 (best-effort)
      if (!user.profileImage) {
        try {
          const bucketName = 'recipes';
          const presetDir = 'profiles/presets';
          const rows = await this.supabaseService.listFiles(bucketName, presetDir);
          const files = (rows as any[]).filter((r) => r.name && !String(r.name).endsWith('/'));
          if (files.length) {
            const pick = files[Math.floor(Math.random() * files.length)];
            const url = this.supabaseService.getPublicUrl(bucketName, `${presetDir}/${pick.name}`);
            user = await this.prismaService.user.update({ where: { id: user.id }, data: { profileImage: url } });
          }
        } catch {}
      }
    } else if ((user as any).status === 'DELETED') {
      // 기존 DELETED 계정 재활성화
      user = await this.prismaService.user.update({
        where: { id: user.id },
        data: { status: 'ACTIVE' as any, deletedAt: null },
      });

      // Fresh start: 관계/세션 초기화
      try {
        await this.prismaService.$transaction(async (tx) => {
          await tx.like.deleteMany({ where: { userId: user.id } });
          await tx.save.deleteMany({ where: { userId: user.id } });
          await tx.follow.deleteMany({ where: { OR: [{ followerId: user.id }, { followingId: user.id }] } });
          await tx.refreshToken.deleteMany({ where: { userId: user.id } });
        });
      } catch {}

      // 이벤트 로그: REACTIVATE(OAuth)
      try {
        await (this.prismaService as any).userLifecycleEvent.create({
          data: {
            userId: user.id,
            type: 'REACTIVATE',
            actorType: 'USER',
            actorId: user.id,
            prevStatus: 'DELETED',
            nextStatus: 'ACTIVE',
            source: 'google-oauth',
          },
        });
      } catch {}
    }

    // SUSPENDED 계정은 OAuth 로그인 거절
    if ((user as any).status !== 'ACTIVE') {
      throw new UnauthorizedException('비활성화된 계정입니다.');
    }

    // JWT 토큰 쌍 생성
    const tokens = await this.tokenService.generateTokenPair(user.id, user.email, device);

    return { 
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage,
      },
    };
  }

  // 이메일 인증/발송 로직 제거됨
} 