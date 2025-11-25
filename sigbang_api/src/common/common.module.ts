import { Global, Module } from '@nestjs/common';
import { LoadWatchdog } from './services/load-watchdog.service';
import { DegradeGuard } from './guards/degrade.guard';

@Global()
@Module({
  providers: [LoadWatchdog, DegradeGuard],
  exports: [LoadWatchdog, DegradeGuard],
})
export class CommonModule {}


