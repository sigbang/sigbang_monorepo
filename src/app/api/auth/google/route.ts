import { NextResponse } from 'next/server';
import { ENV } from '@/lib/env';
import { setTokens } from '@/lib/auth/cookies';
import { getExp } from '@/lib/auth/jwt';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const idToken = body?.idToken as string | undefined;
  if (!idToken) {
    return NextResponse.json({ message: 'missing idToken' }, { status: 400 });
  }

  const upstream = await fetch(`${ENV.API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
    cache: 'no-store',
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '');
    return NextResponse.json({ message: 'auth failed', detail: text || undefined }, { status: upstream.status });
  }

  type GoogleAuthResponse = {
    accessToken?: string;
    refreshToken?: string;
    tokens?: { accessToken?: string; refreshToken?: string };
    user?: unknown;
  };
  const data: GoogleAuthResponse = await upstream.json().catch(() => ({} as GoogleAuthResponse));
  const accessToken: string | undefined = data?.accessToken ?? data?.tokens?.accessToken;
  const refreshToken: string | undefined = data?.refreshToken ?? data?.tokens?.refreshToken;
  if (!accessToken || !refreshToken) {
    return NextResponse.json({ message: 'missing tokens from auth response' }, { status: 502 });
  }

  const exp = getExp(accessToken);
  await setTokens({ accessToken, refreshToken, accessExp: exp });

  return NextResponse.json({ ok: true, user: data?.user ?? null });
}


