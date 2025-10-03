import { NextRequest, NextResponse } from 'next/server';
import { ENV } from '@/lib/env';
import { getAccessToken, getRefreshToken, clearTokens } from '@/lib/auth/cookies';
import { isExpired } from '@/lib/auth/jwt';
import { refreshTokens } from '@/lib/auth/refresh';

async function forward(req: NextRequest, at?: string) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/proxy/, '');
  const target = `${ENV.API_BASE_URL}${path}${url.search || ''}`;

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('cookie');
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
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text(),
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
  let at = await ensureAtBeforeRequest();
  let res = await forward(req, at ?? undefined);
  if (process.env.NODE_ENV !== 'production') console.log('[proxy] response', { status: res.status });

  if (res.status === 401 && (await getRefreshToken())) {
    if (process.env.NODE_ENV !== 'production') console.log('[proxy] got 401, attempting refresh');
    const ok = await refreshTokens();
    if (ok) {
      at = await getAccessToken();
      if (process.env.NODE_ENV !== 'production') console.log('[proxy] retrying after refresh', { hasAT: !!at });
      res = await forward(req, at ?? undefined);
      if (process.env.NODE_ENV !== 'production') console.log('[proxy] retried response', { status: res.status });
    }
  }

  // If still unauthorized after refresh attempt, clear tokens so client can sign out
  if (res.status === 401) {
    await clearTokens();
  }

  const headers = new Headers(res.headers);
  if (res.status === 401) headers.set('x-auth-status', 'invalid');
  const body = res.body ? res.body : null;
  const out = new NextResponse(body, { status: res.status, headers });
  return out;
}


