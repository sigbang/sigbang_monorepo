export const runtime = 'edge';
import { NextRequest } from 'next/server';
import { ENV } from '@/lib/env';

function contentTypeFromPath(p: string) {
  const l = p.toLowerCase();
  if (l.endsWith('.webp')) return 'image/webp';
  if (l.endsWith('.png')) return 'image/png';
  if (l.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path.join('/');

  // 백엔드의 /media/:path 엔드포인트로 프록시하여 이미지 제공
  const encodedKey = path.map(encodeURIComponent).join('/');
  const target = `${ENV.API_BASE_URL}/media/${encodedKey}`;

  const res = await fetch(target, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!res.ok || !res.body) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[media route] backend media fetch failed', { status: res.status });
    }
    return new Response('Not Found', { status: 404 });
  }

  const headers = new Headers(res.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', contentTypeFromPath(key));
  }
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return new Response(res.body, {
    status: res.status,
    headers,
  });
}


