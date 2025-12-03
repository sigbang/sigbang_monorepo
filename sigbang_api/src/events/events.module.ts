import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RecoEventsController } from './reco-events.controller';
import { RecoEventsService } from './reco-events.service';

@Module({
  imports: [DatabaseModule],
  controllers: [RecoEventsController],
  providers: [RecoEventsService],
})
export class EventsModule {}


