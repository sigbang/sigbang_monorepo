'use client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getPopular, getRecommended } from '../api/feed';

export function useRecommendedFeed(limit = 10) {
  return useInfiniteQuery({
    queryKey: ['feed', 'recommended', limit],
    queryFn: ({ pageParam }) => getRecommended({ limit, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function usePopularFeed(limit = 10) {
  return useInfiniteQuery({
    queryKey: ['feed', 'popular', limit],
    queryFn: ({ pageParam }) => getPopular({ limit, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}


