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

export async function getMe() {
  const { data } = await api.get('/users/me');
  return unwrap<MyProfile>(data);
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


