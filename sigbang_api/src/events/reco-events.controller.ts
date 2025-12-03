import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { LogClickDto, LogImpressionsDto } from './dto/reco-events.dto';
import { RecoEventsService } from './reco-events.service';

@ApiTags('이벤트')
@Controller('events/reco')
export class RecoEventsController {
  constructor(private readonly service: RecoEventsService) {}

  @Post('impressions')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '추천 노출 배치 로깅' })
  async impressions(
    @Body() dto: LogImpressionsDto,
    @CurrentUser() user?: any,
    @Headers('x-device-id') deviceId?: string,
  ) {
    return this.service.logImpressions(dto, user?.id, deviceId);
  }

  @Post('click')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '추천 클릭 로깅' })
  async click(
    @Body() dto: LogClickDto,
    @CurrentUser() user?: any,
    @Headers('x-device-id') deviceId?: string,
  ) {
    return this.service.logClick(dto, user?.id, deviceId);
  }
}


