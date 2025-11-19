import { Global, Module } from '@nestjs/common';
import { LoadWatchdog } from './services/load-watchdog.service';
import { SesMailService } from './services/ses-mail.service';
import { DegradeGuard } from './guards/degrade.guard';

@Global()
@Module({
  providers: [LoadWatchdog, DegradeGuard, SesMailService],
  exports: [LoadWatchdog, DegradeGuard, SesMailService],
})
export class CommonModule {}


