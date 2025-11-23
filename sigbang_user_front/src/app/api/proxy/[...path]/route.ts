export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { ENV } from '@/lib/env';
import { getAccessToken, getRefreshToken, clearTokens } from '@/lib/auth/cookies';
import { isExpired } from '@/lib/auth/jwt';
import { refreshTokens } from '@/lib/auth/refresh';

async function forward(req: NextRequest, at: string | undefined, body: ArrayBuffer | undefined) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/proxy/, '');
  const target = `${ENV.API_BASE_URL}${path}${url.search || ''}`;

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('cookie');
  headers.delete('content-length');
  headers.delete('content-encoding');
  if (at) headers.set('authorization', `Bearer ${at}`);

  if (process.env.NODE_ENV !== 'production') {
    console.log('[proxy] forward', {
      method: req.method,
      target,
      hasAuth: !!at,
    });
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    body: (req.method === 'GET' || req.method === 'HEAD') ? undefined : body,
    redirect: 'manual',
    cache: 'no-store',
  };

  return fetch(target, init);
}

async function ensureAtBeforeRequest() {
  let at = await getAccessToken();
  const rt = await getRefreshToken();

  if (at && !isExpired(at, ENV.ACCESS_LEEWAY_SECONDS)) return at;

  if (rt) {
    console.log('[proxy] access token expired or missing, trying refresh', { hasRT: true });
    const ok = await refreshTokens();
    if (ok) at = await getAccessToken();
    console.log('[proxy] refresh result', { ok, hasAT: !!at });
  }
  return at;
}

export async function GET(req: NextRequest)  { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
export async function PUT(req: NextRequest)  { return handle(req); }
export async function PATCH(req: NextRequest){ return handle(req); }
export async function DELETE(req: NextRequest){ return handle(req); }

async function handle(req: NextRequest) {
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  let rawBody: ArrayBuffer | undefined = undefined;
  if (hasBody) {
    try {
      rawBody = await req.arrayBuffer();
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') console.error('[proxy] failed to read request body', e);
    }
  }

  let at = await ensureAtBeforeRequest();
  let res: Response;
  try {
    res = await forward(req, at ?? undefined, rawBody);
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.error('[proxy] initial forward failed', e);
    return new NextResponse('Upstream fetch failed', { status: 502 });
  }
  if (process.env.NODE_ENV !== 'production') console.log('[proxy] response', { status: res.status });

  if (res.status === 401 && (await getRefreshToken())) {
    if (process.env.NODE_ENV !== 'production') console.log('[proxy] got 401, attempting refresh');
    const ok = await refreshTokens();
    if (ok) {
      at = await getAccessToken();
      if (process.env.NODE_ENV !== 'production') console.log('[proxy] retrying after refresh', { hasAT: !!at });
      try {
        res = await forward(req, at ?? undefined, rawBody);
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.error('[proxy] retry forward failed', e);
        return new NextResponse('Upstream fetch failed', { status: 502 });
      }
      if (process.env.NODE_ENV !== 'production') console.log('[proxy] retried response', { status: res.status });
    }
  }

  // Handle various error scenarios
  const headers = new Headers(res.headers);
  
  if (res.status === 401) {
    // Clear tokens on authentication failure
    await clearTokens();
    headers.set('x-auth-status', 'invalid');
  } else if (res.status === 403) {
    // Mark as authorization error (permissions issue)
    headers.set('x-auth-status', 'forbidden');
  } else if (res.status === 422 || res.status === 400) {
    // Check if it's a token format error (clone before reading to avoid locking the stream)
    try {
      const inspect = res.clone();
      const bodyText = await inspect.text();
      if (bodyText && (bodyText.toLowerCase().includes('token') || bodyText.toLowerCase().includes('jwt'))) {
        await clearTokens();
        headers.set('x-auth-status', 'invalid');
        return new NextResponse(bodyText, { status: 401, headers });
      }
    } catch {
      // If inspection fails, fall through and stream the original response body
    }
  }

  const body = res.body ?? null;
  const out = new NextResponse(body, { status: res.status, headers });
  return out;
}


