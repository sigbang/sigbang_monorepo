import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../database/supabase.service';
import { SignUpDto, SignInDto } from './dto/auth.dto';
import { OAuth2Client } from 'google-auth-library';
import { TokenService, TokenPair } from './token.service';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

@Injectable()
export class AuthService {

  private client = new OAuth2Client(GOOGLE_CLIENT_ID);

  constructor(
    private prismaService: PrismaService,
    private supabaseService: SupabaseService,
    private tokenService: TokenService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const { email, password, nickname } = signUpDto;

    // 닉네임 중복 체크
    const existingUser = await this.prismaService.user.findUnique({
      where: { nickname },
    });

    if (existingUser) {
      throw new ConflictException('이미 사용 중인 닉네임입니다.');
    }

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

      // 데이터베이스에 사용자 정보 저장
      const user = await this.prismaService.user.create({
        data: {
          email,
          nickname,
          supabaseId: data.user.id,
        },
      });

      // JWT 토큰 쌍 생성
      const tokens = await this.tokenService.generateTokenPair(user.id, user.email);

      return {
        message: '회원가입이 완료되었습니다.',
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('회원가입 중 오류가 발생했습니다.');
    }
  }

  async signIn(signInDto: SignInDto) {
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
      const user = await this.prismaService.user.findUnique({
        where: { supabaseId: data.user.id },
      });

      if (!user || !user.isActive) {
        throw new NotFoundException('사용자를 찾을 수 없거나 비활성화된 계정입니다.');
      }

      // JWT 토큰 쌍 생성
      const tokens = await this.tokenService.generateTokenPair(user.id, user.email);

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

  async validateGoogleUser(idToken: string) {
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
          profileImage: payload.picture,
          // Google OAuth 사용자는 supabaseId 없이 생성
        },
      });
    }

    // JWT 토큰 쌍 생성
    const tokens = await this.tokenService.generateTokenPair(user.id, user.email);

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
} 