export const runtime = 'edge';
import { NextResponse } from 'next/server';

export const revalidate = 300;

export async function GET() {
  const api = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'https://api.sigbang.com';
  const resp = await fetch(`${api}/recipes/sitemap.xml`, { cache: 'no-store' });
  if (!resp.ok) return new NextResponse('Not Found', { status: 404 });
  const xml = await resp.text();
  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}


