import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class SignUpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '사용자 이메일',
  })
  @IsEmail({}, { message: '올바른 이메일 형식을 입력해주세요.' })
  email: string;

  @ApiProperty({
    example: 'password123!',
    description: '비밀번호 (최소 8자, 영문, 숫자, 특수문자 포함)',
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: '비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.' },
  )
  password: string;

  @ApiProperty({
    example: '요리왕김치',
    description: '닉네임 (2-20자)',
  })
  @IsString()
  @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
  @MaxLength(20, { message: '닉네임은 최대 20자까지 가능합니다.' })
  nickname: string;
}

export class SignInDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '사용자 이메일',
  })
  @IsEmail({}, { message: '올바른 이메일 형식을 입력해주세요.' })
  email: string;

  @ApiProperty({
    example: 'password123!',
    description: '비밀번호',
  })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: '클라이언트 단말 식별자 (선택)' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ description: '클라이언트 표시명 (선택, 예: iPhone 15, Chrome on Mac)' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6...',
    description: '리프레시 토큰',
  })
  @IsString()
  refreshToken: string;

  @ApiPropertyOptional({ description: '클라이언트 단말 식별자 (선택)' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ description: '클라이언트 표시명 (선택)' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class GoogleOAuthDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjY4...',
    description: 'Google ID 토큰',
  })
  @IsString()
  idToken: string;
}

export class SignOutDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6...',
    description: '로그아웃할 리프레시 토큰',
  })
  @IsString()
  refreshToken: string;

  @ApiPropertyOptional({ description: '클라이언트 단말 식별자 (선택)' })
  @IsOptional()
  @IsString()
  deviceId?: string;
} 

export class RevokeSessionDto {
  @ApiPropertyOptional({ description: '세션 토큰 ID (선택)' })
  @IsOptional()
  @IsString()
  tokenId?: string;

  @ApiPropertyOptional({ description: '디바이스 ID (선택)' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}