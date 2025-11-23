export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { ENV } from '@/lib/env';
import { clearTokens, getRefreshToken } from '@/lib/auth/cookies';

export async function POST() {
  const rt = await getRefreshToken();
  try {
    if (rt) {
      await fetch(`${ENV.API_BASE_URL}/auth/signout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
        cache: 'no-store',
      });
    }
  } catch {}
  await clearTokens();
  return NextResponse.json({ ok: true });
}


