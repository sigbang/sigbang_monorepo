'use client';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth/session';
import {
  followUser,
  getFollowCounts,
  getFollowers,
  getFollowings,
  getMe,
  getMyRecipes,
  getMySavedRecipes,
  getUserProfile,
  getUserRecipes,
  unfollowUser,
  getDefaultProfileImages,
  setDefaultProfileImage,
  setRandomProfileImage,
  uploadProfileImage,
  updateNickname,
} from '../api/users';
import type { PublicUser } from '../types/user';

export function useMyProfile() {
  const { status } = useSession();
  return useQuery({
    queryKey: ['me'],
    queryFn: () => getMe(),
    enabled: status === 'authenticated',
  });
}

export function useMyFollowCounts(userId?: string) {
  return useQuery({
    queryKey: ['users', userId, 'follow-counts'],
    queryFn: () => getFollowCounts(userId as string),
    enabled: !!userId,
  });
}

export function useMyRecipes(limit = 12) {
  return useInfiniteQuery({
    queryKey: ['me', 'recipes', limit],
    queryFn: ({ pageParam }) => getMyRecipes({ limit, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useMySavedRecipes(limit = 12) {
  return useInfiniteQuery({
    queryKey: ['me', 'saved', limit],
    queryFn: ({ pageParam }) => getMySavedRecipes({ limit, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

// Public user profile (auth-aware cache key)
export function useUserProfile(userId: string | undefined) {
  const { status } = useSession();
  const authKey = status === 'authenticated' ? 'auth' : 'anon';
  return useQuery<PublicUser>({
    queryKey: ['user', userId, authKey],
    enabled: !!userId,
    queryFn: () => getUserProfile(userId as string),
  });
}

export function useUserRecipes(userId: string | undefined, limit = 20) {
  return useInfiniteQuery({
    queryKey: ['userRecipes', userId, { limit }],
    enabled: !!userId,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => getUserRecipes(userId as string, { limit, cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useFollowers(userId: string | undefined, limit = 20, enabled: boolean = true) {
  return useInfiniteQuery({
    queryKey: ['followers', userId, { limit }],
    enabled: !!userId && enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => getFollowers(userId as string, { limit, cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useFollowings(userId: string | undefined, limit = 20, enabled: boolean = true) {
  return useInfiniteQuery({
    queryKey: ['followings', userId, { limit }],
    enabled: !!userId && enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => getFollowings(userId as string, { limit, cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useToggleFollow(targetUserId: string | undefined) {
  const { status } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['toggleFollow', targetUserId],
    mutationFn: async (next: boolean) => {
      if (status !== 'authenticated') {
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('open-login-modal'));
        throw new Error('Unauthorized');
      }
      const res = next ? await followUser(targetUserId as string) : await unfollowUser(targetUserId as string);
      return res.followed;
    },
    onMutate: async (nextFollowing) => {
      await Promise.allSettled([
        qc.cancelQueries({ queryKey: ['user', targetUserId] }),
        qc.cancelQueries({ queryKey: ['users', targetUserId, 'follow-counts'] }),
      ]);

      // Snapshot previous values
      const prevUserEntries = qc.getQueriesData<PublicUser>({ queryKey: ['user', targetUserId] });
      const prevCounts = qc.getQueryData<{ followerCount: number; followingCount: number }>([
        'users',
        targetUserId,
        'follow-counts',
      ]);

      // Optimistically update user relation.isFollowing
      for (const [key, oldUser] of prevUserEntries) {
        if (!oldUser) continue;
        const updated: PublicUser = {
          ...oldUser,
          relation: { ...(oldUser.relation ?? {}), isFollowing: nextFollowing },
        };
        qc.setQueryData(key, updated);
      }
      // Optimistically bump followerCount on the target profile's counts
      if (prevCounts) {
        const delta = nextFollowing ? 1 : -1;
        qc.setQueryData(['users', targetUserId, 'follow-counts'], {
          ...prevCounts,
          followerCount: Math.max(0, (prevCounts.followerCount ?? 0) + delta),
        });
      }

      return { prevUserEntries, prevCounts } as const;
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      for (const [key, oldUser] of ctx.prevUserEntries) {
        qc.setQueryData(key, oldUser);
      }
      if (ctx.prevCounts) {
        qc.setQueryData(['users', targetUserId, 'follow-counts'], ctx.prevCounts);
      }
    },
    onSuccess: async () => {
      // Invalidate profile and counts for the target user and my lists
      await Promise.allSettled([
        qc.invalidateQueries({ queryKey: ['user', targetUserId] }),
        qc.invalidateQueries({ queryKey: ['users', targetUserId, 'follow-counts'] }),
        qc.invalidateQueries({ queryKey: ['followers'] }),
        qc.invalidateQueries({ queryKey: ['followings'] }),
      ]);
    },
  });
}

// Profile image defaults and mutations
export function useProfileImageDefaults(enabled: boolean = true) {
  return useQuery({
    queryKey: ['users', 'profile-images', 'defaults'],
    queryFn: () => getDefaultProfileImages(),
    enabled,
  });
}

export function useSetRandomProfileImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['users', 'profile-image', 'random'],
    mutationFn: () => setRandomProfileImage(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useSetDefaultProfileImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['users', 'profile-image', 'default'],
    mutationFn: (key: string) => setDefaultProfileImage(key),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useUploadProfileImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['users', 'profile-image', 'upload']
    ,
    mutationFn: (file: File) => uploadProfileImage(file),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}


export function useUpdateNickname() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['users', 'nickname', 'update'],
    mutationFn: (nickname: string) => updateNickname(nickname),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

