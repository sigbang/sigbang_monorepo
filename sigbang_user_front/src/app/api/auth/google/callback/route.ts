export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { ENV } from '@/lib/env';
import { setTokens } from '@/lib/auth/cookies';
import { getExp } from '@/lib/auth/jwt';

const STATE_COOKIE = 'g_oauth_state';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const siteOrigin = ENV.SITE_URL.endsWith('/') ? ENV.SITE_URL.slice(0, -1) : ENV.SITE_URL;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookie = req.headers.get('cookie') || '';
  const stateCookie = cookie.match(/(?:^|; )g_oauth_state=([^;]+)/)?.[1] || '';

  if (!code) {
    return NextResponse.redirect(`${siteOrigin}/login?error=oauth_code`, 302);
  }

  if (!state || !stateCookie || state !== stateCookie) {
    const res = NextResponse.redirect(`${siteOrigin}/login?error=oauth_state`, 302);
    res.headers.append('Set-Cookie', `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`);
    return res;
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${ENV.API_BASE_URL}/auth/google/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        redirectUri: `${siteOrigin}/api/auth/google/callback`,
      }),
      cache: 'no-store',
    });
  } catch {
    const res = NextResponse.redirect(`${siteOrigin}/login?error=network`, 302);
    res.headers.append('Set-Cookie', `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`);
    return res;
  }

  if (!upstream.ok) {
    const res = NextResponse.redirect(`${siteOrigin}/login?error=exchange_failed`, 302);
    res.headers.append('Set-Cookie', `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`);
    return res;
  }

  const raw = await upstream.json().catch(() => ({} as any));
  const accessToken = raw?.accessToken as string | undefined;
  const refreshToken = raw?.refreshToken as string | undefined;

  if (!accessToken || !refreshToken) {
    const res = NextResponse.redirect(`${siteOrigin}/login?error=missing_tokens`, 302);
    res.headers.append('Set-Cookie', `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`);
    return res;
  }

  await setTokens({ accessToken, refreshToken, accessExp: getExp(accessToken) });

  const res = NextResponse.redirect(`${siteOrigin}/`, 302);
  res.headers.append('Set-Cookie', `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`);
  return res;
}


