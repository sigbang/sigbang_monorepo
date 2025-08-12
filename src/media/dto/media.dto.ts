import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export enum MediaKind {
  THUMBNAIL = 'thumbnail',
  STEP = 'step',
}

export class PresignDto {
  @ApiProperty({
    example: 'image/jpeg',
    description: '업로드할 파일의 MIME 타입',
    enum: ['image/jpeg', 'image/png', 'image/webp'],
  })
  @IsString()
  @Matches(/^(image\/(jpeg|png|webp))$/)
  contentType: string;

  @ApiProperty({
    example: 'thumbnail',
    required: false,
    enum: MediaKind,
    description: '이미지 용도 (선택)',
  })
  @IsOptional()
  @IsEnum(MediaKind, { message: 'kind는 thumbnail 또는 step 이어야 합니다.' })
  kind?: MediaKind;
}


