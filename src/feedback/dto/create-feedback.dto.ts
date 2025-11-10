import { IsEnum, IsOptional, IsString, MaxLength, MinLength, IsUrl } from 'class-validator';

export enum FeedbackType {
  bug = 'bug',
  idea = 'idea',
  other = 'other',
}

export class CreateFeedbackDto {
  @IsEnum(FeedbackType)
  type: FeedbackType;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  subject: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message: string;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: '유효한 URL이어야 합니다' })
  pageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  appVersion?: string;
}


