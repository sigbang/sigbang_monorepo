import { NextRequest, NextResponse } from 'next/server';
import { ENV } from '@/lib/env';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUrl = (searchParams.get('url') ?? '').trim();

  if (!rawUrl) {
    return NextResponse.json({ message: 'Missing url' }, { status: 400 });
  }

  const apiBase =
    ENV.API_BASE_URL && /^https?:/i.test(ENV.API_BASE_URL)
      ? ENV.API_BASE_URL
      : 'https://api.sigbang.com';

  const backendUrl = `${apiBase}/link-preview?url=${encodeURIComponent(rawUrl)}`;

  const res = await fetch(backendUrl, { cache: 'no-store' });

  const body = await res.text();

  return new NextResponse(body, {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/json',
    },
  });
}
