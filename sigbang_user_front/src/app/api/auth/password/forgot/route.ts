import { NextResponse } from 'next/server';
import { ENV } from '@/lib/env';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  let upstream: Response;
  try {
    upstream = await fetch(`${ENV.API_BASE_URL}/auth/password/forgot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch (e) {
    return NextResponse.json({ message: 'upstream fetch failed' }, { status: 502 });
  }
  const text = await upstream.text().catch(() => '');
  try {
    const json = text ? JSON.parse(text) : {};
    return NextResponse.json(json, { status: upstream.status });
  } catch {
    return NextResponse.json({ message: text || 'unknown response' }, { status: upstream.status });
  }
}


