import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.FOOD_SAFETY_API_BASE ?? 'http://openapi.foodsafetykorea.go.kr/api';
const KEY = process.env.FOOD_SAFETY_API_KEY as string | undefined;
const SERVICE = process.env.FOOD_SAFETY_SERVICE_ID ?? 'COOKRCP01';

type FoodsafetyBox = {
  RESULT?: { MSG?: string; CODE?: string };
  total_count?: string;
  row?: any[];
};

export async function GET(req: NextRequest) {
  if (!KEY) return NextResponse.json({ message: 'Missing FOOD_SAFETY_API_KEY' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const idxParam = (searchParams.get('idx') ?? '').trim();
  const q = (searchParams.get('q') ?? '').trim();
  const pat = (searchParams.get('pat') ?? '').trim();
  const changedSince = (searchParams.get('changedSince') ?? '').trim(); // YYYYMMDD
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 20)));

  const startIdx = idxParam && /^\d+$/.test(idxParam) ? Number(idxParam) : (page - 1) * pageSize + 1;
  const endIdx = idxParam && /^\d+$/.test(idxParam) ? Number(idxParam) : startIdx + pageSize - 1;

  const segments: string[] = [];
  if (q) segments.push(`RCP_NM=${encodeURIComponent(q)}`);
  if (pat) segments.push(`RCP_PAT2=${encodeURIComponent(pat)}`);
  if (changedSince) segments.push(`CHNG_DT=${encodeURIComponent(changedSince)}`);

  const tail = segments.length ? `/${segments.join('/')}` : '';
  const url = `${API_BASE}/${KEY}/${SERVICE}/json/${startIdx}/${endIdx}${tail}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ message: 'Upstream error', detail: text }, { status: 502 });
  }
  const data = await res.json();
  const box: FoodsafetyBox = (data as any)?.[SERVICE] ?? {};
  const items = Array.isArray(box.row) ? box.row : [];
  const total = Number(box.total_count ?? items.length ?? 0);

  return NextResponse.json({ data: { items, total, page, pageSize } }, { status: 200 });
}


