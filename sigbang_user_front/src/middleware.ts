import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function middleware(req: NextRequest) {
  const { pathname, origin } = new URL(req.url);

  // Match /recipes/:uuid (single segment only)
  const m = pathname.match(/^\/recipes\/([^\/]+)$/);
  if (!m) return NextResponse.next();

  const a = m[1];
  const api = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'https://api.sigbang.com';

  // Skip known static segments
  const reserved = new Set(['new', 'import', 'edit', 'sitemap.xml']);
  if (reserved.has(a)) return NextResponse.next();

  // If UUID v4 → redirect via id→slug resolver
  if (UUID_V4.test(a)) {
    try {
      const resp = await fetch(`${api}/recipes/${a}/slug`, { cache: 'no-store' });
      if (resp.ok) {
        const body: any = await resp.json().catch(() => null);
        const slug: string | undefined = body?.slug;
        if (slug) {
          const url = new URL(`/recipes/${slug}`, origin);
          return NextResponse.redirect(url, 301);
        }
      }
      if (resp.status === 403) return new NextResponse('Forbidden', { status: 403 });
      return new NextResponse('Not Found', { status: 404 });
    } catch {
      return new NextResponse('Not Found', { status: 404 });
    }
  }

  // Single-segment slug fallback → try resolving plain slug to region/slug
  const candidates = [
    `${api}/recipes/slug/${encodeURIComponent(a)}`,
    `${api}/recipes/by-slug/${encodeURIComponent(a)}`,
    `${api}/recipes/slugs/${encodeURIComponent(a)}`,
  ];
  for (const url of candidates) {
    try {
      const resp = await fetch(url, { cache: 'no-store' });
      if (!resp.ok) continue;
      const body: any = await resp.json().catch(() => null);
      const slugPath: string | undefined = body?.slugPath || body?.path || body?.slug;
      const region: string | undefined = body?.region;
      const slug: string | undefined = typeof body?.slug === 'string' ? body.slug : undefined;
      const path = (slugPath && typeof slugPath === 'string' && slugPath.includes('/'))
        ? slugPath
        : (region && slug ? `${region}/${slug}` : undefined);
      if (path) {
        const to = new URL(`/recipes/${path}`, origin);
        return NextResponse.redirect(to, 301);
      }
    } catch {
      // try next
    }
  }

  // As a last resort, probe common regions and redirect if found
  const defaultRegions = ['ko', 'kr', 'en'];
  for (const region of defaultRegions) {
    try {
      const test = await fetch(`${api}/recipes/by-slug/${encodeURIComponent(region)}/${encodeURIComponent(a)}`, { method: 'HEAD', cache: 'no-store' });
      if (test.ok) {
        const to = new URL(`/recipes/${region}/${a}`, origin);
        return NextResponse.redirect(to, 301);
      }
    } catch {
      // continue
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/recipes/:a*'],
};


