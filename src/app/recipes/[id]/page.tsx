import { cookies } from 'next/headers';
import RecipeDetailClient from './RecipeDetailClient';
import { mapRecipeDetail, RecipeDetail } from '@/lib/api/recipes';

export const revalidate = 0;

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jar = await cookies();
  const allCookies = jar.getAll();
  const cookieHeader = allCookies.map((c: { name: string; value: string }) => `${c.name}=${encodeURIComponent(c.value)}`).join('; ');

  let initial: RecipeDetail | null = null;
  try {
    const res = await fetch(`/api/proxy/recipes/${id}`, {
      cache: 'no-store',
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    });
    if (res.ok) {
      const json: unknown = await res.json().catch(() => null);
      const data = json && typeof json === 'object' && json !== null && 'data' in (json as Record<string, unknown>)
        ? (json as { data: unknown }).data
        : json;
      if (data && typeof data === 'object' && data !== null) initial = mapRecipeDetail(data);
    }
  } catch {}

  return <RecipeDetailClient id={id} initial={initial} />;
}


