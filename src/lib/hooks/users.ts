'use client';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getFollowCounts, getMe, getMyRecipes, getMySavedRecipes } from '../api/users';

export function useMyProfile() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => getMe(),
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


