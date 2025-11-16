import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.FOOD_SAFETY_API_BASE ?? 'https://openapi.foodsafetykorea.go.kr/api';
const KEY = process.env.FOOD_SAFETY_API_KEY as string | undefined;
const SERVICE = process.env.FOOD_SAFETY_SERVICE_ID ?? 'COOKRCP01';

type FoodsafetyBox = {
  RESULT?: { MSG?: string; CODE?: string };
  total_count?: string;
  row?: any[];
};

async function fetchWithRetry(
  url: string,
  opts: RequestInit & { timeoutMs?: number; retries?: number; backoffMs?: number } = {}
) {
  const { timeoutMs = 15000, retries = 1, backoffMs = 500, ...rest } = opts;

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...rest, signal: controller.signal, cache: 'no-store' });
      clearTimeout(timer);
      return res;
    } catch (err: any) {
      clearTimeout(timer);
      const code = err?.code || err?.cause?.code;
      const isAbort = err?.name === 'AbortError';
      const isHeadersTimeout = code === 'UND_ERR_HEADERS_TIMEOUT';
      const canRetry = attempt < retries && (isAbort || isHeadersTimeout);
      if (!canRetry) throw err;
      attempt += 1;
      const delay = backoffMs * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

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

  try {
    const res = await fetchWithRetry(url, { timeoutMs: 15000, retries: 1 });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ message: 'Upstream error', detail: text }, { status: 502 });
    }
    const data = await res.json();
    const box: FoodsafetyBox = (data as any)?.[SERVICE] ?? {};
    const items = Array.isArray(box.row) ? box.row : [];
    const total = Number(box.total_count ?? items.length ?? 0);

    return NextResponse.json({ data: { items, total, page, pageSize } }, { status: 200 });
  } catch (err: any) {
    const code = err?.code || err?.cause?.code;
    if (err?.name === 'AbortError' || code === 'UND_ERR_HEADERS_TIMEOUT') {
      return NextResponse.json({ message: 'Upstream timeout', detail: String(code || err?.message || err) }, { status: 504 });
    }
    return NextResponse.json({ message: 'Upstream fetch failed', detail: String(err?.message || err) }, { status: 502 });
  }
}


