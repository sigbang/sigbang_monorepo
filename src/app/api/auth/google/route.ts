import { NextResponse } from 'next/server';
import { ENV } from '@/lib/env';
import { setTokens } from '@/lib/auth/cookies';
import { getExp } from '@/lib/auth/jwt';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const idToken = (body?.idToken || body?.credential || body?.id_token) as string | undefined;
  if (!idToken) {
    return NextResponse.json({ message: 'missing idToken' }, { status: 400 });
  }

  let upstream: Response;
  try {
    const payload = { idToken } as const;
    const target = `${ENV.API_BASE_URL}/auth/google`;
    upstream = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ message: 'upstream fetch failed' }, { status: 502 });
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '');
    return NextResponse.json({ message: 'auth failed', detail: text || undefined }, { status: upstream.status });
  }

  let raw: unknown = null;
  try {
    raw = await upstream.json();
  } catch {}

  const toObj = (v: unknown): Record<string, unknown> => (typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {});
  const r = toObj(raw);
  const tokensObj = toObj(r.tokens ?? toObj(toObj(r.data).tokens));
  const accessCandidate = (tokensObj.accessToken ?? r.accessToken) as string | undefined;
  const refreshCandidate = (tokensObj.refreshToken ?? r.refreshToken) as string | undefined;

  const accessToken: string | undefined = accessCandidate;
  const refreshToken: string | undefined = refreshCandidate;

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ message: 'missing tokens from auth response', raw }, { status: 502 });
  }

  const exp = getExp(accessToken);
  await setTokens({ accessToken, refreshToken, accessExp: exp });

  return NextResponse.json({ ok: true, user: toObj(raw).user ?? null });
}


