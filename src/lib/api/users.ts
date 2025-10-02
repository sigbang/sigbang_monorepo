import { api, unwrap } from './client';
import type { PaginatedRecipes } from '../types/recipe';

export type MyProfile = {
  id: string;
  name?: string | null;
  image?: string | null;
  recipesCount: number;
};

export type FollowCounts = {
  followerCount: number;
  followingCount: number;
};

type RawMeResponse = {
  id: string;
  nickname?: string | null;
  name?: string | null;
  profileImage?: string | null;
  image?: string | null;
  recipesCount?: number | null;
  stats?: { recipesCount?: number | null } | null;
  _count?: { recipes?: number | null } | null;
};

export async function getMe() {
  const { data } = await api.get('/users/me');
  const raw = unwrap<RawMeResponse>(data);

  const mapped: MyProfile = {
    id: raw.id,
    name: (raw.nickname ?? raw.name ?? null) as string | null,
    image: (raw.profileImage ?? raw.image ?? null) as string | null,
    recipesCount:
      (typeof raw.recipesCount === 'number' ? raw.recipesCount : undefined) ??
      (typeof raw?.stats?.recipesCount === 'number' ? raw.stats.recipesCount : undefined) ??
      (typeof raw?._count?.recipes === 'number' ? raw._count.recipes : 0),
  };

  return mapped;
}

export async function getFollowCounts(userId: string) {
  const { data } = await api.get(`/users/${userId}/follow-counts`);
  return unwrap<FollowCounts>(data);
}

export async function getMyRecipes(params: { limit: number; cursor?: string }) {
  const { data } = await api.get('/users/me/recipes', {
    params: { limit: params.limit, ...(params.cursor ? { cursor: params.cursor } : {}) },
  });
  return unwrap<PaginatedRecipes>(data);
}

export async function getMySavedRecipes(params: { limit: number; cursor?: string }) {
  const { data } = await api.get('/users/me/saved-recipes', {
    params: { limit: params.limit, ...(params.cursor ? { cursor: params.cursor } : {}) },
  });
  return unwrap<PaginatedRecipes>(data);
}


