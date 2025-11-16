import { IsEnum, IsOptional, IsString, MaxLength, MinLength, IsEmail } from 'class-validator';

export enum FeedbackType {
  bug = 'bug',
  idea = 'idea',
  other = 'other',
  business = 'business',
}

export class CreateFeedbackDto {
  @IsEnum(FeedbackType)
  type: FeedbackType;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  subject: string;

  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  message: string;

  // 선택: 연락 받을 이메일(회신용)
  @IsOptional()
  @IsEmail({}, { message: '유효한 이메일이어야 합니다' })
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  appVersion?: string;
}


