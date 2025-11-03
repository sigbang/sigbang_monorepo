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

// Profile image presets and updates
export type ProfileImagePreset = { key: string; url?: string | null };

function toMediaUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:/i.test(pathOrUrl)) return pathOrUrl;
  const clean = pathOrUrl.startsWith('/') ? pathOrUrl.slice(1) : pathOrUrl;
  return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
}

export async function getDefaultProfileImages(): Promise<ProfileImagePreset[]> {
  const { data } = await api.get('/users/profile-images/defaults');
  const raw = unwrap<unknown>(data);
  let items: unknown[] = [];
  if (Array.isArray(raw)) {
    items = raw as unknown[];
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const images = obj['images'];
    if (Array.isArray(images)) items = images as unknown[];
  }
  return items.map((it) => {
    if (typeof it === 'string') return { key: it, url: toMediaUrl(it) } as ProfileImagePreset;
    if (typeof it === 'object' && it !== null) {
      const obj = it as Record<string, unknown>;
      const keyRaw = (obj['key'] ?? obj['path'] ?? obj['id']) as string | undefined;
      const urlRaw = (obj['url'] ?? obj['src'] ?? obj['path'] ?? obj['key']) as string | undefined;
      const key = keyRaw ? String(keyRaw) : '';
      const url = urlRaw ? String(urlRaw) : key;
      return { key, url: toMediaUrl(url) } as ProfileImagePreset;
    }
    const s = String(it as unknown as string);
    return { key: s, url: toMediaUrl(s) } as ProfileImagePreset;
  });
}

export type UpdateProfileImageResponse = { profileImage?: string | null; image?: string | null };

export async function setRandomProfileImage(): Promise<string | null> {
  const { data } = await api.patch('/users/me/profile-image/random');
  const res = unwrap<UpdateProfileImageResponse>(data);
  return (res.profileImage ?? res.image ?? null) as string | null;
}

export async function setDefaultProfileImage(key: string): Promise<string | null> {
  const { data } = await api.patch('/users/me/profile-image/default', { key });
  const res = unwrap<UpdateProfileImageResponse>(data);
  return (res.profileImage ?? res.image ?? null) as string | null;
}

export async function uploadProfileImage(file: File): Promise<string | null> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/users/me/profile-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const res = unwrap<UpdateProfileImageResponse>(data);
  return (res.profileImage ?? res.image ?? null) as string | null;
}


// Update nickname
export type UpdateNicknameResponse = { message?: string; user?: unknown; nickname?: string; name?: string };
export async function updateNickname(nickname: string): Promise<UpdateNicknameResponse> {
  const { data } = await api.patch('/users/me', { nickname });
  return unwrap<UpdateNicknameResponse>(data);
}

// Delete current user account
export async function deleteMe(): Promise<void> {
  await api.delete('/users/me');
}