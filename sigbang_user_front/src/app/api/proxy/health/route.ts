export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { ENV } from '@/lib/env';

export async function GET() {
  const startedAt = Date.now();

  // Be resilient if env is missing at build time
  const apiBase =
    ENV.API_BASE_URL && /^https?:/i.test(ENV.API_BASE_URL)
      ? ENV.API_BASE_URL
      : 'https://api.sigbang.com';

  let upstreamStatus: number | null = null;
  let ok = true;
  let error: string | undefined;

  try {
    const res = await fetch(`${apiBase}/health`, { cache: 'no-store' });
    upstreamStatus = res.status;
    ok = res.ok;
  } catch (e: any) {
    ok = false;
    error = e?.message || 'fetch failed';
  }

  const ms = Date.now() - startedAt;
  return NextResponse.json(
    {
      ok,
      service: 'web',
      proxy: true,
      apiBase,
      upstreamStatus,
      durationMs: ms,
      timestamp: new Date().toISOString(),
      ...(error ? { error } : {}),
    },
    { status: ok ? 200 : 502 },
  );
}


