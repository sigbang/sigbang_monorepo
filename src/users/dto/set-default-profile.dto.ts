import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SetDefaultProfileImageDto {
  @ApiProperty({
    example: '1.png',
    description: '기본 제공 이미지 파일명 또는 상대 경로 (예: profiles/presets/1.png)',
  })
  @IsString()
  key: string;
}


