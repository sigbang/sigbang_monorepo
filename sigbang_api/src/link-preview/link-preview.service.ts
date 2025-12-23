import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { isIP } from 'net';

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

  async getPreview(rawUrl: string): Promise<LinkPreview> {
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
          // 명시적으로 서비스 기반 프리뷰 봇임을 알린다
          'User-Agent': 'SigbangLinkPreview/1.0 (+https://sigbang.com/bot)',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
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
    const lower = host.toLowerCase().trim();
    if (!lower) return true;

    // 직접 IP 가 들어온 경우 RFC1918/loopback/link-local/메타데이터 대역 차단
    const ipVersion = isIP(lower);
    if (ipVersion === 4) {
      const [a, b, c, d] = lower.split('.').map((v) => Number(v));

      // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
      if (a === 10) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;

      // loopback 127.0.0.0/8
      if (a === 127) return true;

      // 링크 로컬 및 AWS 메타데이터 169.254.0.0/16
      if (a === 169 && b === 254) return true;

      // 0.0.0.0/8 등 비정상 대역
      if (a === 0) return true;
    } else if (ipVersion === 6) {
      // IPv6 loopback / link-local / ULA
      if (lower === '::1') return true;
      if (lower.startsWith('fe80:')) return true; // link-local
      if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
    }

    // 호스트명이 내부/로컬을 가리키는 경우 차단
    if (lower === 'localhost') return true;
    if (lower.endsWith('.local') || lower.endsWith('.internal')) return true;

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
}
