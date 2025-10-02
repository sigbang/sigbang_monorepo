import { api } from './client';
import type { PaginatedRecipes } from '../types/recipe';

function unwrap<T>(raw: any): T {
  return (raw?.data ?? raw) as T;
}

export async function getRecommended(params: { limit: number; cursor?: string }) {
  const { data } = await api.get('/feed/recommended', {
    params: { limit: params.limit, ...(params.cursor ? { cursor: params.cursor } : {}) },
  });
  return unwrap<PaginatedRecipes>(data);
}

export async function getPopular(params: { limit: number; cursor?: string }) {
  const { data } = await api.get('/feed/popular', {
    params: { limit: params.limit, ...(params.cursor ? { cursor: params.cursor } : {}) },
  });
  return unwrap<PaginatedRecipes>(data);
}

export async function getExplore(params: { limit: number; cursor?: string }) {
  const { data } = await api.get('/feed', {
    params: { limit: params.limit, ...(params.cursor ? { cursor: params.cursor } : {}) },
  });
  return unwrap<PaginatedRecipes>(data);
}


