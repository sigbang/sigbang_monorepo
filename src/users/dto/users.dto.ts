import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: '새로운닉네임',
    description: '변경할 닉네임',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
  @MaxLength(20, { message: '닉네임은 최대 20자까지 가능합니다.' })
  nickname?: string;

  @ApiProperty({
    example: '안녕하세요! 요리를 사랑하는 사람입니다.',
    description: '사용자 소개',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '소개는 최대 200자까지 가능합니다.' })
  bio?: string;
}

export class UserResponseDto {
  @ApiProperty({ example: 'uuid', description: '사용자 ID' })
  id: string;

  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  email: string;

  @ApiProperty({ example: '요리왕김치', description: '닉네임' })
  nickname: string;

  @ApiProperty({ 
    example: 'https://example.com/profile.jpg', 
    description: '프로필 이미지 URL',
    required: false,
  })
  profileImage?: string;

  @ApiProperty({ 
    example: '안녕하세요! 요리를 사랑하는 사람입니다.', 
    description: '사용자 소개',
    required: false,
  })
  bio?: string;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: '가입일' })
  createdAt: Date;
} 