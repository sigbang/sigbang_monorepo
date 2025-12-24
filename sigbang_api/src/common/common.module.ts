import { Global, Module } from '@nestjs/common';
import { LoadWatchdog } from './services/load-watchdog.service';
import { DegradeGuard } from './guards/degrade.guard';
import { SafeBrowsingService } from './services/safe-browsing.service';
import { ExternalLinkService } from './services/external-link.service';

@Global()
@Module({
  providers: [LoadWatchdog, DegradeGuard, SafeBrowsingService, ExternalLinkService],
  exports: [LoadWatchdog, DegradeGuard, SafeBrowsingService, ExternalLinkService],
})
export class CommonModule {}


