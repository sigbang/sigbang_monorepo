import { useInfiniteQuery } from '@tanstack/react-query';
import { searchRecipes } from '../api/recipes';
import { SearchResponse, Recipe } from '../types/recipe';
// Legacy search hooks removed; use useSearchFeed below

// React Query 기반 표준 검색 피드 훅
export function useSearchFeed(query: string, limit = 20) {
  const parse = (response: SearchResponse | any) => {
    let recipes: Recipe[] = [];
    let nextCursor: string | null | undefined = undefined;
    if (response && typeof response === 'object') {
      if ('items' in response && Array.isArray((response as any).items)) {
        recipes = (response as any).items as Recipe[];
        nextCursor = null;
      } else if ('data' in response && (response as any).data) {
        const data = (response as any).data as any;
        recipes = Array.isArray(data.recipes) ? (data.recipes as Recipe[]) : [];
        nextCursor = data.pageInfo?.nextCursor ?? null;
      } else if ('recipes' in response) {
        recipes = Array.isArray((response as any).recipes) ? ((response as any).recipes as Recipe[]) : [];
        nextCursor = (response as any).pageInfo?.nextCursor ?? null;
      }
    }
    return { recipes, nextCursor } as { recipes: Recipe[]; nextCursor?: string | null };
  };

  return useInfiniteQuery({
    queryKey: ['search', query, limit],
    enabled: !!query && query.trim().length > 0,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const res = await searchRecipes({ q: query, limit, cursor: pageParam as string | undefined });
      const parsed = parse(res);
      return parsed;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}
