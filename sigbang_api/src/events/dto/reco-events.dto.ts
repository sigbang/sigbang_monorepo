import { ApiProperty } from '@nestjs/swagger';

export class ImpressionItemDto {
  @ApiProperty() recipeId!: string;
  @ApiProperty({ required: false }) position?: number;
  @ApiProperty({ required: false }) rankScore?: number;
}

export class LogImpressionsDto {
  @ApiProperty({ enum: ['feed', 'popular', 'recommended'] }) surface!: 'feed' | 'popular' | 'recommended';
  @ApiProperty({ required: false }) expId?: string;
  @ApiProperty({ required: false, enum: ['A', 'B'] }) expVariant?: 'A' | 'B';
  @ApiProperty({ required: false }) seed?: string;
  @ApiProperty({ required: false }) cursor?: string | null;
  @ApiProperty({ required: false }) sessionId?: string;
  @ApiProperty({ type: [ImpressionItemDto] }) items!: ImpressionItemDto[];
}

export class LogClickDto {
  @ApiProperty({ enum: ['feed', 'popular', 'recommended'] }) surface!: 'feed' | 'popular' | 'recommended';
  @ApiProperty({ required: false }) expId?: string;
  @ApiProperty({ required: false, enum: ['A', 'B'] }) expVariant?: 'A' | 'B';
  @ApiProperty({ required: false }) seed?: string;
  @ApiProperty({ required: false }) sessionId?: string;
  @ApiProperty() recipeId!: string;
  @ApiProperty({ required: false }) position?: number;
  @ApiProperty({ required: false }) rankScore?: number;
}


