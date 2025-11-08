import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as os from 'os';

// Optional: event loop delay monitor (Node >= 12)
let monitorEventLoopDelay: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ({ monitorEventLoopDelay } = require('perf_hooks'));
} catch {
  monitorEventLoopDelay = undefined;
}

@Injectable()
export class LoadWatchdog implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timer;
  private prev = process.cpuUsage();
  private lastCheck = Date.now();
  private histogram: any | undefined = undefined;
  private overSince: number | null = null;
  private degraded = false;
  private enabled = true;

  // Defaults; can be tuned via env
  private cpuDegrade = Number(process.env.WATCHDOG_CPU_DEGRADE ?? 0.7); // 70%
  private cpuKill = Number(process.env.WATCHDOG_CPU_KILL ?? 0.8); // 80%
  private lagMsThreshold = Number(process.env.WATCHDOG_LAG_MS ?? 200);
  private degradeAfterMs = Number(process.env.WATCHDOG_DEGRADE_MS ?? 10_000);
  private killAfterMs = Number(process.env.WATCHDOG_KILL_MS ?? 45_000);
  private sampleIntervalMs = Number(process.env.WATCHDOG_SAMPLE_MS ?? 2000);

  isDegraded(): boolean {
    return this.degraded;
  }

  onModuleInit() {
    if (String(process.env.WATCHDOG_ENABLED ?? 'true') === 'false') {
      this.enabled = false;
      return;
    }
    if (monitorEventLoopDelay) {
      this.histogram = monitorEventLoopDelay({ resolution: 20 });
      this.histogram.enable();
    }
    this.timer = setInterval(() => this.tick(), this.sampleIntervalMs).unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.histogram) {
      try { this.histogram.disable(); } catch {}
    }
  }

  private tick() {
    if (!this.enabled) return;

    const now = Date.now();
    const deltaMs = now - this.lastCheck;
    this.lastCheck = now;

    const usage = process.cpuUsage(this.prev);
    this.prev = process.cpuUsage();

    const cores = Math.max(1, (os.cpus() || []).length);
    const cpuPercent = (usage.user + usage.system) / 1e6 /*ms*/ / (deltaMs * cores);

    let lagMs = 0;
    try {
      if (this.histogram) {
        lagMs = this.histogram.mean / 1e6; // ns -> ms
        // Reset the histogram to avoid drift
        this.histogram.reset();
      }
    } catch {
      lagMs = 0;
    }

    const overDegrade = cpuPercent >= this.cpuDegrade || lagMs >= this.lagMsThreshold;
    const overKill = cpuPercent >= this.cpuKill || lagMs >= this.lagMsThreshold;

    if (overDegrade) {
      if (!this.overSince) this.overSince = now;
      const sustained = now - this.overSince;
      if (sustained >= this.degradeAfterMs) {
        this.degraded = true;
      }
      if (overKill && sustained >= this.killAfterMs) {
        // Last resort: request graceful shutdown
        try {
          // eslint-disable-next-line no-console
          console.error(
            `[watchdog] sustained overload detected (cpu=${(cpuPercent * 100).toFixed(
              1,
            )}% lag=${lagMs.toFixed(0)}ms, ${sustained}ms). Sending SIGTERM.`,
          );
        } catch {}
        try {
          process.kill(process.pid, 'SIGTERM');
        } catch {}
      }
    } else {
      this.overSince = null;
      this.degraded = false;
    }
  }
}


