import { ENV } from '@/lib/env';
import { toRecipeCardItem } from '@/lib/mappers/recipeCard';
import type { Recipe } from '@/lib/types/recipe';
import type { RecipeCardItem } from '@/lib/types/recipeCard';

type FeedKind = 'popular' | 'recommended';

async function fetchFeed(kind: FeedKind, limit: number): Promise<RecipeCardItem[]> {
  const apiBase = ENV.API_BASE_URL.replace(/\/+$/, '');
  const url = `${apiBase}/feed/${kind}?limit=${encodeURIComponent(String(limit))}`;

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
    // 홈 화면 전체가 깨지지 않도록, 실패 시에는 비어 있는 리스트를 반환
    return [];
  }

  const json: unknown = await res.json().catch(() => null);
  const obj = (json ?? {}) as Record<string, any>;
  const inner =
    obj.data && typeof obj.data === 'object'
      ? (obj.data as Record<string, any>)
      : obj;

  const recipes: Recipe[] = Array.isArray(inner.recipes)
    ? (inner.recipes as Recipe[])
    : Array.isArray(inner.items)
    ? (inner.items as Recipe[])
    : [];

  return recipes.map((r) => toRecipeCardItem(r as any));
}

export async function fetchHomePopular(limit = 6): Promise<RecipeCardItem[]> {
  return fetchFeed('popular', limit);
}

export async function fetchHomeRecommended(limit = 6): Promise<RecipeCardItem[]> {
  return fetchFeed('recommended', limit);
}

