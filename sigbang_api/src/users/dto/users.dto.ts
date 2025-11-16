import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, MinLength, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

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

// 사용자 레시피/북마크 목록 커서 기반 페이지네이션 DTO
export class UsersRecipesQueryDto {
  @ApiProperty({
    example: 'eyJpZCI6ICJ1dWlkIiwgImNyZWF0ZWRBdCI6ICIyMDI1LTA4LTEzVDEyOjM0OjU2LjAwMFoifQ==',
    description: '커서(키셋) 페이징용 cursor. 이전 응답의 nextCursor를 그대로 전달',
    required: false,
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({
    example: 20,
    description: '페이지 크기 (커서 기반 take)',
    required: false,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 20;
}

export class UsersFollowsQueryDto {
  @ApiProperty({
    example: 'eyJpZCI6ICJ1dWlkIiwgImNyZWF0ZWRBdCI6ICIyMDI1LTA4LTEzVDEyOjM0OjU2LjAwMFoifQ==',
    description: '커서(키셋) 페이징용 cursor. 이전 응답의 nextCursor를 그대로 전달',
    required: false,
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({
    example: 20,
    description: '페이지 크기 (커서 기반 take)',
    required: false,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 20;
}

export class FollowUserDto {
  @ApiProperty({ example: 'uuid', description: '사용자 ID' })
  id: string;

  @ApiProperty({ example: '요리왕김치', description: '닉네임' })
  nickname: string;

  @ApiProperty({ example: 'https://example.com/profile.jpg', required: false })
  profileImage?: string;

  @ApiProperty({ example: '2025-10-01T12:00:00.000Z', description: '팔로우(관계) 생성 시각' })
  followedAt: Date;

  @ApiProperty({ description: '뷰어 기준, 내가 이 유저를 팔로우 중인지', required: false })
  isFollowing?: boolean;

  @ApiProperty({ description: '뷰어 기준, 이 유저가 나를 팔로우 중인지', required: false })
  isFollowedBy?: boolean;
}