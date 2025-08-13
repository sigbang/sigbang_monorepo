import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsInt,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsUrl,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

import { Difficulty as PrismaDifficulty } from '../../../generated/prisma';

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

// Prisma enum과 DTO enum 매핑
export { PrismaDifficulty };

export enum RecipeStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

// 레시피 단계 DTO
export class RecipeStepDto {
  @ApiProperty({
    example: 1,
    description: '단계 순서',
  })
  @IsInt()
  @Min(1)
  order: number;

  @ApiProperty({
    example: '팬에 돼지고기를 볶아주세요.',
    description: '조리 설명',
  })
  @IsString()
  @MinLength(5, { message: '단계 설명은 최소 5자 이상이어야 합니다.' })
  @MaxLength(500, { message: '단계 설명은 최대 500자까지 가능합니다.' })
  description: string;

  @ApiProperty({
    example: 'temp/u_123/20250101/step1.jpg',
    description: '단계별 이미지 스토리지 경로 (presign path)',
    required: false,
  })
  @IsOptional()
  @IsString()
  imagePath?: string;
}

// 태그 DTO
export class TagDto {
  @ApiProperty({
    example: '오사카 요리',
    description: '태그명',
  })
  @IsString()
  @MinLength(1, { message: '태그명은 최소 1자 이상이어야 합니다.' })
  @MaxLength(20, { message: '태그명은 최대 20자까지 가능합니다.' })
  name: string;

  @ApiProperty({
    example: '🇯🇵',
    description: '태그 이모지',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10, { message: '이모지는 최대 10자까지 가능합니다.' })
  emoji?: string;
}

// 레시피 등록 DTO
export class CreateRecipeDto {
  @ApiProperty({
    example: '레몬 고소 부타',
    description: '레시피 제목',
  })
  @IsString()
  @MinLength(2, { message: '제목은 최소 2자 이상이어야 합니다.' })
  @MaxLength(100, { message: '제목은 최대 100자까지 가능합니다.' })
  title: string;

  @ApiProperty({
    example: '일본식 고소한 돼지고기',
    description: '레시피 설명',
  })
  @IsString()
  @MinLength(10, { message: '설명은 최소 10자 이상이어야 합니다.' })
  @MaxLength(1000, { message: '설명은 최대 1000자까지 가능합니다.' })
  description: string;

  @ApiProperty({
    example: '돼지고기 200g\n간장 2T\n마늘',
    description: '재료 목록 (멀티라인)',
  })
  @IsString()
  @MinLength(5, { message: '재료는 최소 5자 이상이어야 합니다.' })
  @MaxLength(2000, { message: '재료는 최대 2000자까지 가능합니다.' })
  ingredients: string;

  @ApiProperty({
      example: 'temp/u_123/20250101/thumbnail.jpg',
      description: '레시피 대표 이미지 스토리지 경로 (presign path)',
      required: false,
    })
    @IsOptional()
    @IsString()
    thumbnailPath?: string;

  @ApiProperty({
    example: 30,
    description: '조리 시간 (분)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: '조리 시간은 최소 1분 이상이어야 합니다.' })
  @Max(600, { message: '조리 시간은 최대 600분까지 가능합니다.' })
  cookingTime?: number;

  @ApiProperty({
    example: 2,
    description: '몇 인분',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: '인분은 최소 1인분 이상이어야 합니다.' })
  @Max(20, { message: '인분은 최대 20인분까지 가능합니다.' })
  servings?: number;

  @ApiProperty({
    example: Difficulty.EASY,
    description: '난이도',
    enum: Difficulty,
  })
  @IsEnum(Difficulty, { message: '유효한 난이도를 선택해주세요.' })
  difficulty: Difficulty;

  @ApiProperty({
    type: [TagDto],
    description: '태그 목록',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: '태그는 최대 10개까지 가능합니다.' })
  @ValidateNested({ each: true })
  @Type(() => TagDto)
  tags?: TagDto[];

  @ApiProperty({
    type: [RecipeStepDto],
    description: '조리 단계',
  })
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개 이상의 조리 단계가 필요합니다.' })
  @ArrayMaxSize(20, { message: '조리 단계는 최대 20개까지 입력 가능합니다.' })
  @ValidateNested({ each: true })
  @Type(() => RecipeStepDto)
  steps: RecipeStepDto[];
}

// 레시피 수정 DTO
export class UpdateRecipeDto extends PartialType(CreateRecipeDto) {}

// 피드 조회 DTO
export class RecipeQueryDto {
  @ApiProperty({
    example: 'cmVjaXBlX2lkOjEyMy0uLi4=',
    description: '커서(키셋) 페이징용 cursor. 이전 응답의 nextCursor를 그대로 전달',
    required: false,
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({
    example: 10,
    description: '페이지 크기 (커서 기반 take)',
    required: false,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({
    example: 'latest',
    description: '정렬 기준 (latest: 최신순, popular: 인기순, views: 조회수순)',
    required: false,
    default: 'latest',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'latest' | 'popular' | 'views' = 'latest';

  @ApiProperty({
    example: 'EASY',
    description: '난이도 필터',
    required: false,
    enum: Difficulty,
  })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiProperty({
    example: '김치',
    description: '검색 키워드',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiProperty({
    example: '한식',
    description: '태그 필터',
    required: false,
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiProperty({
    example: 60,
    description: '최대 조리 시간 (분)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxCookingTime?: number;

  @ApiProperty({
    example: true,
    description: '팔로잉 우선 믹스 비중 상향 여부 (실험용)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  followingBoost?: boolean;

  @ApiProperty({
    example: '2025-08-13T12:34:56.000Z',
    description: '해당 시각 이후로 생성된 새 글 개수(newCount) 계산용 기준 시각',
    required: false,
  })
  @IsOptional()
  @IsString()
  since?: string;
}

// 레시피 응답 DTO
export class RecipeResponseDto {
  @ApiProperty({ example: 'uuid', description: '레시피 ID' })
  id: string;

  @ApiProperty({ example: '레몬 고소 부타', description: '제목' })
  title: string;

  @ApiProperty({ example: '일본식 고소한 돼지고기', description: '설명' })
  description: string;

  @ApiProperty({ example: '돼지고기 200g\n간장 2T\n마늘', description: '재료' })
  ingredients: string;

  @ApiProperty({ example: 'https://example.com/recipe-thumbnail.jpg', description: '대표 이미지' })
  thumbnailImage?: string;

  @ApiProperty({ example: 30, description: '조리 시간' })
  cookingTime?: number;

  @ApiProperty({ example: 2, description: '인분' })
  servings?: number;

  @ApiProperty({ example: 'EASY', description: '난이도' })
  difficulty: Difficulty;

  @ApiProperty({ example: 'PUBLISHED', description: '상태' })
  status: RecipeStatus;

  @ApiProperty({ example: 0, description: '조회수' })
  viewCount: number;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: '생성일' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: '수정일' })
  updatedAt: Date;

  @ApiProperty({ description: '작성자 정보' })
  author: {
    id: string;
    nickname: string;
    profileImage?: string;
  };

  @ApiProperty({ type: [TagDto], description: '태그 목록' })
  tags: TagDto[];

  @ApiProperty({ type: [RecipeStepDto], description: '조리 단계' })
  steps: RecipeStepDto[];

  @ApiProperty({ example: 5, description: '좋아요 수' })
  likesCount: number;

  @ApiProperty({ example: 3, description: '댓글 수' })
  commentsCount: number;

  @ApiProperty({ example: false, description: '현재 사용자의 좋아요 여부' })
  isLiked?: boolean;

  @ApiProperty({ example: false, description: '현재 사용자의 저장 여부' })
  isSaved?: boolean;
}

// 임시 저장 목록 응답 DTO
export class DraftRecipeResponseDto {
  @ApiProperty({ example: 'uuid', description: '레시피 ID' })
  id: string;

  @ApiProperty({ example: '레몬 고소 부타', description: '제목' })
  title: string;

  @ApiProperty({ example: '일본식 고소한 돼지고기', description: '설명' })
  description: string;

  @ApiProperty({ example: 'DRAFT', description: '상태' })
  status: RecipeStatus;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: '생성일' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: '수정일' })
  updatedAt: Date;
}