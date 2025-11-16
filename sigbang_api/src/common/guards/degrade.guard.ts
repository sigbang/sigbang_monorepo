import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { LoadWatchdog } from '../services/load-watchdog.service';

@Injectable()
export class DegradeGuard implements CanActivate {
  constructor(private readonly watchdog: LoadWatchdog) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.watchdog || !this.watchdog.isDegraded()) {
      return true;
    }
    const res = context.switchToHttp().getResponse();
    try {
      res.set('Retry-After', '10');
      res.status(503).send({ message: '서버 과부하. 잠시 후 다시 시도해 주세요.' });
    } catch {}
    return false;
  }
}


