import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const EXTERNAL_LINK_EVENT_TYPES = ['RENDERED', 'CLICKED'] as const;
export type ExternalLinkEventTypeDto = (typeof EXTERNAL_LINK_EVENT_TYPES)[number];

export class RecordExternalLinkEventDto {
  @ApiProperty({ enum: EXTERNAL_LINK_EVENT_TYPES, example: 'CLICKED' })
  @IsIn(EXTERNAL_LINK_EVENT_TYPES)
  type: ExternalLinkEventTypeDto;

  @ApiProperty({ required: false, example: 'click', description: 'User action type. For CLICKED, set to click.' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  actionType?: string;

  @ApiProperty({ required: false, example: false, description: 'Auto redirect should always be false (guarded server-side).' })
  @IsOptional()
  @IsBoolean()
  isAutoRedirect?: boolean;

  @ApiProperty({ required: false, example: 'https://example.com', description: 'Original URL shown to user' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  url?: string;

  @ApiProperty({ required: false, example: 'https://final.example.com', description: 'Final URL (after redirect), if known on client' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  finalUrl?: string;
}


