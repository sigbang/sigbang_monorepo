import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { SafeBrowsingService } from './safe-browsing.service';

export type ExternalLinkSafetyGrade = 'SAFE' | 'UNKNOWN' | 'BLOCK';

export type ValidatedExternalLink = {
  inputUrl: string;
  finalUrl: string;
  host: string;
  redirectCount: number;
  httpStatus: number;
  checkedAt: Date;
  safetyGrade: ExternalLinkSafetyGrade;
  threatTypes: string[];
};

@Injectable()
export class ExternalLinkService {
  private readonly logger = new Logger(ExternalLinkService.name);

  // policy knobs (P0)
  private readonly maxRedirects = 5;
  private readonly timeoutMs = 8000;

  // allowlist for SAFE badge
  private readonly safeDomains = ['coupang.com', 'baemin.com', 'store.naver.com'];

  constructor(private readonly safeBrowsingService: SafeBrowsingService) {}

  async validateAndClassify(rawUrl: string): Promise<ValidatedExternalLink> {
    const inputUrl = (rawUrl ?? '').trim();
    if (!inputUrl) throw new BadRequestException('Missing linkUrl');

    let current: URL;
    try {
      current = new URL(inputUrl);
    } catch {
      throw new BadRequestException('Invalid linkUrl');
    }

    // https only
    if (current.protocol !== 'https:') {
      throw new BadRequestException('Only https:// links are allowed');
    }

    if (current.username || current.password) {
      throw new BadRequestException('URL credentials are not allowed');
    }

    // scheme hard-block (defense-in-depth)
    this.ensureAllowedScheme(current.protocol);

    // redirect follow with DNS/private IP checks each hop
    const chain: string[] = [];
    let lastStatus = 0;

    for (let i = 0; i <= this.maxRedirects; i++) {
      await this.ensureHostAllowed(current.hostname);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      let res: Response;
      try {
        res = await fetch(current.toString(), {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent': 'SigbangLinkSafety/1.0 (+https://sigbang.com/bot)',
            Accept: '*/*',
          },
        });
      } catch (e) {
        clearTimeout(timer);
        throw new BadRequestException('Upstream fetch failed');
      } finally {
        clearTimeout(timer);
      }

      lastStatus = res.status;

      // allow 2xx
      if (res.status >= 200 && res.status <= 299) {
        break;
      }

      // handle redirects
      if (res.status >= 300 && res.status <= 399) {
        const loc = res.headers.get('location');
        if (!loc) {
          throw new BadRequestException('Redirect without Location');
        }
        const next = new URL(loc, current);
        this.ensureAllowedScheme(next.protocol);
        if (next.protocol !== 'https:') {
          throw new BadRequestException('Only https:// links are allowed');
        }
        chain.push(next.toString());
        current = next;
        if (i === this.maxRedirects) {
          throw new BadRequestException('Too many redirects');
        }
        continue;
      }

      // 4xx/5xx => reject
      throw new BadRequestException(`Unacceptable response status: ${res.status}`);
    }

    const finalUrl = current.toString();
    const host = current.hostname;
    const redirectCount = chain.length;
    const httpStatus = lastStatus || 0;

    // block direct download-like targets
    const pathLower = (current.pathname || '').toLowerCase();
    if (pathLower.endsWith('.apk') || pathLower.endsWith('.exe')) {
      throw new BadRequestException('Executable downloads are not allowed');
    }

    // Safe Browsing check (BLOCK signal)
    const threatTypes = await this.safeBrowsingService.findThreatTypes(finalUrl);

    const safetyGrade: ExternalLinkSafetyGrade =
      threatTypes.length > 0
        ? 'BLOCK'
        : this.isSafeDomain(host)
          ? 'SAFE'
          : 'UNKNOWN';

    return {
      inputUrl,
      finalUrl,
      host,
      redirectCount,
      httpStatus,
      checkedAt: new Date(),
      safetyGrade,
      threatTypes,
    };
  }

  private ensureAllowedScheme(proto: string) {
    const lower = (proto || '').toLowerCase();
    const blocked = ['javascript:', 'data:', 'file:', 'blob:', 'intent:', 'market:'];
    if (blocked.includes(lower)) {
      throw new BadRequestException('Unsupported URL scheme');
    }
  }

  private isSafeDomain(host: string): boolean {
    const h = (host || '').toLowerCase();
    return this.safeDomains.some((d) => h === d || h.endsWith(`.${d}`));
  }

  private async ensureHostAllowed(host: string) {
    const lower = (host || '').toLowerCase().trim();
    if (!lower) throw new BadRequestException('Blocked host');

    // obvious local/internal hostnames
    if (lower === 'localhost') throw new BadRequestException('Blocked host');
    if (lower.endsWith('.local') || lower.endsWith('.internal')) throw new BadRequestException('Blocked host');

    // direct IP in hostname
    const ipVersion = isIP(lower);
    if (ipVersion === 4 || ipVersion === 6) {
      if (this.isPrivateOrLocalIp(lower)) throw new BadRequestException('Blocked host');
      return;
    }

    // DNS resolve and block private ranges (protect against DNS rebinding / SSRF)
    try {
      const addrs = await lookup(lower, { all: true, verbatim: true });
      if (!addrs || addrs.length === 0) throw new BadRequestException('Blocked host');
      for (const a of addrs) {
        if (this.isPrivateOrLocalIp(a.address)) {
          throw new BadRequestException('Blocked host');
        }
      }
    } catch (e: any) {
      // On DNS failures, treat as invalid input
      this.logger.warn(`DNS lookup failed host=${lower} err=${String(e?.message || e)}`);
      throw new BadRequestException('Blocked host');
    }
  }

  private isPrivateOrLocalIp(ip: string): boolean {
    const v = isIP(ip);
    if (v === 4) {
      const [a, b] = ip.split('.').map((x) => Number(x));
      if (a === 10) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
      if (a === 127) return true;
      if (a === 169 && b === 254) return true; // link-local + AWS metadata range
      if (a === 0) return true;
      return false;
    }
    if (v === 6) {
      const lower = ip.toLowerCase();
      if (lower === '::1') return true;
      if (lower.startsWith('fe80:')) return true; // link-local
      if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // ULA
      return false;
    }
    return true; // non-ip treated as unsafe in this context
  }
}


