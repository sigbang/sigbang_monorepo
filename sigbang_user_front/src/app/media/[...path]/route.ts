export const runtime = 'edge';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function contentTypeFromPath(p: string) {
  const l = p.toLowerCase();
  if (l.endsWith('.webp')) return 'image/webp';
  if (l.endsWith('.png')) return 'image/png';
  if (l.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path.join('/');

  // Supabase 스토리지에서 파일 다운로드
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_BUCKET || 'images';

  if (!supabaseUrl || !serviceKey) {
    return new Response('Storage not configured', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data, error } = await supabase.storage.from(bucket).download(key);

  if (error || !data) {
    console.error('Supabase download error:', error);
    return new Response('Not Found', { status: 404 });
  }

  const arr = await data.arrayBuffer();
  return new Response(arr, {
    headers: {
      'Content-Type': contentTypeFromPath(key),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}


