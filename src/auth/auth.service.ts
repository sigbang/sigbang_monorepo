import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../database/supabase.service';
import { SignUpDto, SignInDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private supabaseService: SupabaseService,
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

      return {
        message: '회원가입이 완료되었습니다.',
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

      return {
        message: '로그인 성공',
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
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

  async refreshToken(refreshToken: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.refreshSession({
          refresh_token: refreshToken,
        });

      if (error) {
        throw new NotFoundException('토큰 갱신에 실패했습니다.');
      }

      return {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      };
    } catch (error) {
      throw new NotFoundException('토큰 갱신 중 오류가 발생했습니다.');
    }
  }

  async signOut(accessToken: string) {
    try {
      await this.supabaseService.getClient().auth.signOut();
      return { message: '로그아웃 되었습니다.' };
    } catch (error) {
      return { message: '로그아웃 처리 중 오류가 발생했습니다.' };
    }
  }
} 