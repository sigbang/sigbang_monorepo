import { api } from './client';
import type { PaginatedRecipes, Recipe } from '../types/recipe';

function unwrap<T>(raw: any): T {
  return (raw?.data ?? raw) as T;
}

function toPaginatedRecipes(raw: unknown): PaginatedRecipes {
  const obj = (raw ?? {}) as Record<string, any>;
  const inner = (obj.data && typeof obj.data === 'object') ? (obj.data as Record<string, any>) : obj;

  const recipes: Recipe[] = Array.isArray(inner.recipes)
    ? (inner.recipes as Recipe[])
    : Array.isArray(inner.items)
    ? (inner.items as Recipe[])
    : [];

  const nextCursor: string | null | undefined =
    (typeof inner.nextCursor === 'string' || inner.nextCursor === null)
      ? (inner.nextCursor as string | null)
      : (inner.pageInfo && typeof inner.pageInfo === 'object')
      ? ((inner.pageInfo as any).nextCursor ?? null)
      : undefined;

  return { recipes, nextCursor };
}

export async function getRecommended(params: { limit: number; cursor?: string }) {
  const { data } = await api.get('/feed/recommended', {
    params: { limit: params.limit, ...(params.cursor ? { cursor: params.cursor } : {}) },
  });
  return toPaginatedRecipes(unwrap(data));
}

export async function getPopular(params: { limit: number; cursor?: string }) {
  const { data } = await api.get('/feed/popular', {
    params: { limit: params.limit, ...(params.cursor ? { cursor: params.cursor } : {}) },
  });
  return toPaginatedRecipes(unwrap(data));
}

export async function getExplore(params: { limit: number; cursor?: string }) {
  const { data } = await api.get('/feed', {
    params: { limit: params.limit, ...(params.cursor ? { cursor: params.cursor } : {}) },
  });
  return toPaginatedRecipes(unwrap(data));
}


