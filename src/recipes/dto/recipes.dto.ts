import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsInt,
  IsEnum,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export class CreateRecipeDto {
  @ApiProperty({
    example: '김치찌개 레시피',
    description: '레시피 제목',
  })
  @IsString()
  @MinLength(2, { message: '제목은 최소 2자 이상이어야 합니다.' })
  @MaxLength(100, { message: '제목은 최대 100자까지 가능합니다.' })
  title: string;

  @ApiProperty({
    example: '정말 맛있는 김치찌개 만드는 방법입니다.',
    description: '레시피 설명',
  })
  @IsString()
  @MinLength(10, { message: '설명은 최소 10자 이상이어야 합니다.' })
  @MaxLength(1000, { message: '설명은 최대 1000자까지 가능합니다.' })
  description: string;

  @ApiProperty({
    example: ['김치 200g', '돼지고기 100g', '두부 1/2모', '대파 1대'],
    description: '재료 목록',
  })
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개 이상의 재료가 필요합니다.' })
  @ArrayMaxSize(30, { message: '재료는 최대 30개까지 입력 가능합니다.' })
  @IsString({ each: true })
  ingredients: string[];

  @ApiProperty({
    example: [
      '김치를 적당한 크기로 잘라주세요.',
      '팬에 돼지고기를 볶아주세요.',
      '김치를 넣고 함께 볶아주세요.',
      '물을 넣고 끓여주세요.',
    ],
    description: '조리 과정',
  })
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개 이상의 조리 과정이 필요합니다.' })
  @ArrayMaxSize(20, { message: '조리 과정은 최대 20단계까지 입력 가능합니다.' })
  @IsString({ each: true })
  instructions: string[];

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
    example: ['한식', '찌개'],
    description: '태그 목록',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: '태그는 최대 10개까지 가능합니다.' })
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    example: true,
    description: '공개 여부',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateRecipeDto extends PartialType(CreateRecipeDto) {}

export class RecipeQueryDto {
  @ApiProperty({
    example: 1,
    description: '페이지 번호',
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    example: 10,
    description: '페이지당 아이템 수',
    required: false,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
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
  maxCookingTime?: number;
}

export class RecipeResponseDto {
  @ApiProperty({ example: 'uuid', description: '레시피 ID' })
  id: string;

  @ApiProperty({ example: '김치찌개 레시피', description: '제목' })
  title: string;

  @ApiProperty({ example: '정말 맛있는 김치찌개...', description: '설명' })
  description: string;

  @ApiProperty({ example: ['김치 200g', '돼지고기 100g'], description: '재료' })
  ingredients: string[];

  @ApiProperty({ example: ['김치를 썰어주세요.', '볶아주세요.'], description: '조리 과정' })
  instructions: string[];

  @ApiProperty({ example: ['https://example.com/image1.jpg'], description: '이미지 URL' })
  images: string[];

  @ApiProperty({ example: 30, description: '조리 시간' })
  cookingTime?: number;

  @ApiProperty({ example: 2, description: '인분' })
  servings?: number;

  @ApiProperty({ example: 'EASY', description: '난이도' })
  difficulty: Difficulty;

  @ApiProperty({ example: 0, description: '조회수' })
  viewCount: number;

  @ApiProperty({ example: true, description: '공개 여부' })
  isPublished: boolean;

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

  @ApiProperty({ example: 5, description: '좋아요 수' })
  likesCount: number;

  @ApiProperty({ example: 3, description: '댓글 수' })
  commentsCount: number;

  @ApiProperty({ example: false, description: '현재 사용자의 좋아요 여부' })
  isLiked?: boolean;

  @ApiProperty({ example: false, description: '현재 사용자의 저장 여부' })
  isSaved?: boolean;
} 