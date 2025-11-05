'use client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getPopular, getRecommended, getExplore } from '../api/feed';

export function useRecommendedFeed(limit = 10) {
  return useInfiniteQuery({
    queryKey: ['feed', 'recommended', limit],
    queryFn: ({ pageParam }) => getRecommended({ limit, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}

export function usePopularFeed(limit = 10) {
  return useInfiniteQuery({
    queryKey: ['feed', 'popular', limit],
    queryFn: ({ pageParam }) => getPopular({ limit, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}

export function useExploreFeed(limit = 10) {
  return useInfiniteQuery({
    queryKey: ['feed', 'explore', limit],
    queryFn: ({ pageParam }) => getExplore({ limit, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}


