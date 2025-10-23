import { api, unwrap } from './client';
import type { PaginatedRecipes, Recipe } from '@/lib/types/recipe';
import type { PaginatedUsers, PublicUser } from '@/lib/types/user';

type PageInfo = { limit?: number; nextCursor?: string | null; hasMore?: boolean };
type UserListResponse = { users?: PublicUser[]; items?: PublicUser[]; pageInfo?: PageInfo };
type UserRecipesResponse = { recipes?: Recipe[]; items?: Recipe[]; pageInfo?: PageInfo };

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

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

// Public user profile (optional auth for relation flags)
export async function getUserProfile(userId: string): Promise<PublicUser> {
  const { data } = await api.get(`/users/${userId}`);
  return unwrap<PublicUser>(data);
}

// Public or owner-only recipes list for a user
export async function getUserRecipes(userId: string, params: { limit: number; cursor?: string }) {
  const { data } = await api.get(`/users/${userId}/recipes`, {
    params: { limit: params.limit, ...(params.cursor ? { cursor: params.cursor } : {}) },
  });
  const raw = unwrap<UserRecipesResponse>(data);
  const recipes = safeArray<Recipe>(raw.recipes ?? raw.items);
  const nextCursor = raw.pageInfo?.nextCursor ?? null;
  return { recipes, nextCursor } as PaginatedRecipes;
}

// Followers list
export async function getFollowers(userId: string, params: { limit: number; cursor?: string }) {
  const { data } = await api.get(`/users/${userId}/followers`, {
    params: { limit: params.limit, ...(params.cursor ? { cursor: params.cursor } : {}) },
  });
  const raw = unwrap<UserListResponse>(data);
  const users = safeArray<PublicUser>(raw.users ?? raw.items);
  const nextCursor = raw.pageInfo?.nextCursor ?? null;
  return { users, nextCursor } as PaginatedUsers;
}

// Followings list
export async function getFollowings(userId: string, params: { limit: number; cursor?: string }) {
  const { data } = await api.get(`/users/${userId}/followings`, {
    params: { limit: params.limit, ...(params.cursor ? { cursor: params.cursor } : {}) },
  });
  const raw = unwrap<UserListResponse>(data);
  const users = safeArray<PublicUser>(raw.users ?? raw.items);
  const nextCursor = raw.pageInfo?.nextCursor ?? null;
  return { users, nextCursor } as PaginatedUsers;
}

// Follow / Unfollow actions (idempotent)
export type ToggleFollowResponse = { followed: boolean };
export async function followUser(userId: string): Promise<ToggleFollowResponse> {
  const { data } = await api.post(`/users/${userId}/follow`);
  return unwrap<ToggleFollowResponse>(data);
}

export async function unfollowUser(userId: string): Promise<ToggleFollowResponse> {
  const { data } = await api.delete(`/users/${userId}/follow`);
  return unwrap<ToggleFollowResponse>(data);
}

