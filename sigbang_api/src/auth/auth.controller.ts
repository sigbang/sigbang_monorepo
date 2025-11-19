import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Headers,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignUpDto, SignInDto, RefreshTokenDto, GoogleOAuthDto, SignOutDto, RevokeSessionDto, VerifyEmailDto, ResendVerificationDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { JwtFastGuard } from '../common/guards/jwt-fast.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('인증')
@Controller('auth')
@UseGuards(ThrottlerGuard) // Rate limiting 적용
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공 (인증 메일 발송)',
    schema: {
      example: {
        message: '인증 메일을 보냈습니다. 메일함을 확인해주세요.',
      },
    },
  })
  @ApiResponse({ status: 409, description: '이미 존재하는 사용자' })
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-forwarded-for') xff?: string,
  ) {
    const ip = typeof xff === 'string' ? xff.split(',')[0]?.trim() : undefined;
    return this.authService.signUp(signUpDto, { userAgent, ip });
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: {
      example: {
        message: '로그인 성공',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'a1b2c3d4e5f6789...',
        expiresIn: 900,
        user: {
          id: 'uuid',
          email: 'user@example.com',
          nickname: '요리왕김치',
          profileImage: null,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: '이메일 또는 비밀번호가 잘못됨' })
  async signIn(
    @Body() signInDto: SignInDto,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-forwarded-for') xff?: string,
  ) {
    const ip = typeof xff === 'string' ? xff.split(',')[0]?.trim() : undefined;
    return this.authService.signIn(signInDto, {
      deviceId: signInDto.deviceId,
      deviceName: signInDto.deviceName,
      userAgent,
      ip,
    });
  }

  @Post('email/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일 인증 메일 재발송' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일 인증 완료' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '비밀번호 재설정 메일 발송' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '비밀번호 재설정' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '비밀번호 변경 (로그인 상태)' })
  async changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '토큰 갱신' })
  @ApiResponse({
    status: 200,
    description: '토큰 갱신 성공',
    schema: {
      example: {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresIn: 900,
      },
    },
  })
  @ApiResponse({ status: 401, description: '토큰 갱신 실패' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({
    status: 200,
    description: '로그아웃 성공',
    schema: {
      example: {
        message: '로그아웃 되었습니다.',
      },
    },
  })
  async signOut(@Body() signOutDto: SignOutDto) {
    return this.authService.signOut(signOutDto.refreshToken);
  }

  @Post('signout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '모든 기기에서 로그아웃' })
  @ApiResponse({
    status: 200,
    description: '모든 기기에서 로그아웃 성공',
    schema: {
      example: {
        message: '모든 기기에서 로그아웃 되었습니다.',
      },
    },
  })
  async signOutAll(@CurrentUser() user: any) {
    return this.authService.signOutAll(user.id);
  }

  @Post('sessions/revoke')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '특정 기기 세션 로그아웃' })
  @ApiResponse({ status: 200, description: '세션이 무효화되었습니다.' })
  async revokeSession(@CurrentUser() user: any, @Body() dto: RevokeSessionDto) {
    return this.authService.revokeSession(user.id, dto);
  }

  @Post('sessions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '내 기기 세션 목록 조회' })
  @ApiResponse({ status: 200, description: '세션 목록' })
  async listSessions(@CurrentUser() user: any) {
    return this.authService.listSessions(user.id);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google OAuth 로그인' })
  @ApiResponse({
    status: 200,
    description: 'Google 로그인 성공',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'a1b2c3d4e5f6789...',
        expiresIn: 900,
        user: {
          id: 'uuid',
          email: 'user@gmail.com',
          nickname: '구글사용자',
          profileImage: 'https://lh3.googleusercontent.com/...',
        },
      },
    },
  })
  async googleLogin(
    @Body() googleOAuthDto: GoogleOAuthDto,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-forwarded-for') xff?: string,
  ) {
    const ip = typeof xff === 'string' ? xff.split(',')[0]?.trim() : undefined;
    return this.authService.validateGoogleUser(googleOAuthDto.idToken, {
      deviceId: googleOAuthDto.deviceId,
      deviceName: googleOAuthDto.deviceName,
      userAgent,
      ip,
    });
  }

  @Get('validate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtFastGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '액세스 토큰 유효성 검사 (빠른 204)' })
  @ApiResponse({ status: 204, description: '유효한 토큰' })
  @ApiResponse({ status: 401, description: '유효하지 않은 토큰' })
  validate() {
    return;
  }
} 