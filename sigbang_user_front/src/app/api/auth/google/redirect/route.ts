export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { ENV } from '@/lib/env';

const STATE_COOKIE = 'g_oauth_state';

function randomState() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(req: Request) {
  const siteOrigin = ENV.SITE_URL.endsWith('/') ? ENV.SITE_URL.slice(0, -1) : ENV.SITE_URL;
  const redirectUri = `${siteOrigin}/api/auth/google/callback`;
  const state = randomState();

  const params = new URLSearchParams({
    client_id: ENV.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    include_granted_scopes: 'false',
    state,
  });

  const target = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  const res = NextResponse.redirect(target, 302);
  res.headers.append('Set-Cookie', `${STATE_COOKIE}=${state}; Path=/; HttpOnly; SameSite=Lax; Secure`);
  return res;
}


