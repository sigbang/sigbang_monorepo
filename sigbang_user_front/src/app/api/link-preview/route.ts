export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

type LinkPreview = {
  url: string;
  finalUrl?: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
};

const MAX_HTML_BYTES = 200_000;

function isSupportedProtocol(proto: string) {
  return proto === 'http:' || proto === 'https:';
}

function isBlockedHost(host: string) {
  const lower = host.toLowerCase();
  if (lower === 'localhost' || lower === '127.0.0.1') return true;
  if (lower.startsWith('10.') || lower.startsWith('192.168.') || lower.startsWith('172.16.')) return true;
  return false;
}

function extractMeta(html: string, key: string): string | undefined {
  const re = new RegExp(`<meta[^>]+property=["']${key}["'][^>]*>`, 'i');
  const match = html.match(re);
  if (!match) return undefined;
  const tag = match[0];
  const contentMatch = tag.match(/content=["']([^"']*)["']/i);
  return contentMatch?.[1]?.trim() || undefined;
}

function extractNamedMeta(html: string, name: string): string | undefined {
  const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*>`, 'i');
  const match = html.match(re);
  if (!match) return undefined;
  const tag = match[0];
  const contentMatch = tag.match(/content=["']([^"']*)["']/i);
  return contentMatch?.[1]?.trim() || undefined;
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() || undefined;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUrl = (searchParams.get('url') ?? '').trim();

  if (!rawUrl) {
    return NextResponse.json({ message: 'Missing url' }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ message: 'Invalid url' }, { status: 400 });
  }

  if (!isSupportedProtocol(targetUrl.protocol)) {
    return NextResponse.json({ message: 'Unsupported protocol' }, { status: 400 });
  }

  if (isBlockedHost(targetUrl.hostname)) {
    return NextResponse.json({ message: 'Blocked host' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(targetUrl.toString(), {
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timer);

    const finalUrl = res.url;
    const contentType = res.headers.get('content-type') ?? '';

    if (!contentType.toLowerCase().includes('text/html')) {
      const fallback: LinkPreview = {
        url: rawUrl,
        finalUrl,
      };
      return NextResponse.json({ data: fallback }, { status: 200 });
    }

    let html = await res.text();
    if (html.length > MAX_HTML_BYTES) {
      html = html.slice(0, MAX_HTML_BYTES);
    }

    const ogTitle = extractMeta(html, 'og:title');
    const ogDesc = extractMeta(html, 'og:description');
    const ogImage = extractMeta(html, 'og:image');
    const ogSiteName = extractMeta(html, 'og:site_name');

    const metaDesc = extractNamedMeta(html, 'description');
    const titleTag = extractTitle(html);

    const preview: LinkPreview = {
      url: rawUrl,
      finalUrl,
      title: ogTitle || titleTag || undefined,
      description: ogDesc || metaDesc || undefined,
      image: ogImage || undefined,
      siteName: ogSiteName || undefined,
    };

    return NextResponse.json({ data: preview }, { status: 200 });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return NextResponse.json({ message: 'Timeout fetching url' }, { status: 504 });
    }
    return NextResponse.json({ message: 'Failed to fetch url', detail: String(err?.message || err) }, { status: 502 });
  }
}


