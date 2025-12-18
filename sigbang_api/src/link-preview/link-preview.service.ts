import { Injectable, BadRequestException, Logger } from '@nestjs/common';

export type LinkPreview = {
  url: string;
  finalUrl?: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
};

type CacheEntry = {
  preview: LinkPreview;
  expiresAt: number;
};

@Injectable()
export class LinkPreviewService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly ttlMs = 6 * 60 * 60 * 1000; // 6시간 캐시
  private readonly logger = new Logger(LinkPreviewService.name);

  async getPreview(rawUrl: string, depth = 0): Promise<LinkPreview> {
    const url = rawUrl.trim();
    if (!url) {
      throw new BadRequestException('Missing url');
    }

    let target: URL;
    try {
      target = new URL(url);
    } catch {
      throw new BadRequestException('Invalid url');
    }

    if (!this.isSupportedProtocol(target.protocol)) {
      throw new BadRequestException('Unsupported protocol');
    }

    if (this.isBlockedHost(target.hostname)) {
      throw new BadRequestException('Blocked host');
    }

    const cacheKey = target.toString();
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.preview;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    let res: Response;
    try {
      res = await fetch(target.toString(), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile Safari/604.1',
          Accept: 'text/html',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          Referer: 'https://www.google.com/',
        },
      });      
    } catch (e) {
      clearTimeout(timer);
      throw new BadRequestException('Upstream fetch failed');
    }

    clearTimeout(timer);

    const finalUrl = res.url;
    const contentType = res.headers.get('content-type') ?? '';

    // HTML이 아니면 최소 정보만
    if (!contentType.toLowerCase().includes('text/html')) {
      const preview: LinkPreview = { url, finalUrl };
      this.cache.set(cacheKey, { preview, expiresAt: now + this.ttlMs });
      return preview;
    }

    let html = await res.text();
    if (html.length > 200_000) {
      html = html.slice(0, 200_000);
    }

    // 쿠팡 브릿지 랜딩 페이지라면 redirectWebUrl을 파싱해서 한 번 더 시도
    const coupangRedirectUrl =
      depth < 2 ? this.extractCoupangRedirectUrl(html) : undefined;
    if (coupangRedirectUrl) {
      this.logger.log({
        url,
        finalUrl,
        coupangRedirectUrl,
      });

      try {
        const nested = await this.getPreview(coupangRedirectUrl, depth + 1);
        // 원래 짧은 URL 키에도 결과를 캐시해 둔다
        this.cache.set(cacheKey, {
          preview: nested,
          expiresAt: now + this.ttlMs,
        });
        return nested;
      } catch (e) {
        this.logger.warn(
          `Failed to follow Coupang redirect for ${url}: ${String(
            (e as Error).message ?? e,
          )}`,
        );
        // 실패하면 그냥 현재 HTML 기준으로 계속 진행
      }
    }

    const ogTitle = this.extractMeta(html, 'og:title');
    const ogDesc = this.extractMeta(html, 'og:description');
    const ogImage = this.extractMeta(html, 'og:image');
    const ogSiteName = this.extractMeta(html, 'og:site_name');
    const metaDesc = this.extractNamedMeta(html, 'description');
    const titleTag = this.extractTitle(html);

    const host = target.hostname;

    let title = ogTitle || titleTag || undefined;
    let description = ogDesc || metaDesc || undefined;
    let image = ogImage || undefined;
    const siteName = ogSiteName || host || undefined;

    // Access Denied / 차단 페이지 감지
    const lowerTitle = (title ?? '').toLowerCase();
    const lowerHtml = html.toLowerCase();

    const looksAccessDenied =
      lowerTitle === 'access denied' ||
      lowerTitle.includes('access denied') ||
      (lowerHtml.includes('access denied') &&
        (lowerHtml.includes('request blocked') ||
          lowerHtml.includes("you don't have permission") ||
          lowerHtml.includes('you are not authorized') ||
          lowerHtml.includes('access to this resource is denied')));

    if (looksAccessDenied) {
      title = undefined;
      description = undefined;
      image = undefined;
    }

    const preview: LinkPreview = {
      url,
      finalUrl,
      title,
      description,
      image,
      siteName,
    };

    this.cache.set(cacheKey, { preview, expiresAt: now + this.ttlMs });

    return preview;
  }

  private isSupportedProtocol(proto: string) {
    return proto === 'http:' || proto === 'https:';
  }

  private isBlockedHost(host: string) {
    const lower = host.toLowerCase();

    if (lower === 'localhost' || lower === '127.0.0.1' || lower === '::1') return true;
    if (lower.startsWith('10.') || lower.startsWith('192.168.') || lower.startsWith('172.16.')) return true;

    return false;
  }

  private extractMeta(html: string, key: string): string | undefined {
    const re = new RegExp(`<meta[^>]+property=["']${key}["'][^>]*>`, 'i');
    const match = html.match(re);
    if (!match) return undefined;

    const tag = match[0];
    const contentMatch = tag.match(/content=["']([^"']*)["']/i);

    return contentMatch?.[1]?.trim() || undefined;
  }

  private extractNamedMeta(html: string, name: string): string | undefined {
    const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*>`, 'i');
    const match = html.match(re);
    if (!match) return undefined;

    const tag = match[0];
    const contentMatch = tag.match(/content=["']([^"']*)["']/i);

    return contentMatch?.[1]?.trim() || undefined;
  }

  private extractTitle(html: string): string | undefined {
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return match?.[1]?.trim() || undefined;
  }

  /**
   * 쿠팡 마케팅 브릿지 랜딩 페이지 HTML에서 redirectWebUrl 값을 추출한다.
   * 예시: var redirectWebUrl = 'https\\x3A\\x2F\\x2Fwww\\x2Ecoupang\\x2Ecom...';
   */
  private extractCoupangRedirectUrl(html: string): string | undefined {
    if (!html.includes('redirectWebUrl')) return undefined;

    const match = html.match(
      /redirectWebUrl\s*=\s*'([^']+)'/,
    );
    if (!match) return undefined;

    const raw = match[1];
    // \xNN 시퀀스를 실제 문자로 디코딩 (예: \x3A -> ':', \x2F -> '/')
    const decoded = raw.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    );

    // 혹시나 남아있는 역슬래시는 한 번 정리
    return decoded.replace(/\\\//g, '/');
  }
}
