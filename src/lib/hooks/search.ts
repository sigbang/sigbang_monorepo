import { useState, useCallback, useRef, useEffect } from 'react';
import { searchRecipes, SearchParams } from '../api/recipes';
import { SearchResponse, Recipe } from '../types/recipe';

export type UseSearchOptions = {
  initialLimit?: number;
  onError?: (error: Error) => void;
};

export type SearchState = {
  query: string;
  recipes: Recipe[];
  loading: boolean;
  loadingMore: boolean;
  hasNextPage: boolean;
  nextCursor: string | null;
  error: Error | null;
  total: number;
  newCount: number;
};

export function useSearch(options: UseSearchOptions = {}) {
  const { initialLimit = 20, onError } = options;
  
  const [state, setState] = useState<SearchState>({
    query: '',
    recipes: [],
    loading: false,
    loadingMore: false,
    hasNextPage: false,
    nextCursor: null,
    error: null,
    total: 0,
    newCount: 0,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const search = useCallback(async (query: string, reset = true) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    if (reset) {
      setState(prev => ({
        ...prev,
        query,
        recipes: [],
        loading: true,
        loadingMore: false,
        hasNextPage: false,
        nextCursor: null,
        error: null,
        total: 0,
        newCount: 0,
      }));
    } else {
      setState(prev => ({
        ...prev,
        loadingMore: true,
        error: null,
      }));
    }
    
    try {
      const params: SearchParams = {
        q: query,
        limit: initialLimit,
        cursor: reset ? undefined : state.nextCursor,
      };
      
      const response = await searchRecipes(params);
      
      // Safely extract data from response
      let recipes: Recipe[] = [];
      let pageInfo: any = {};
      
      if (response && typeof response === 'object') {
        // Handle the actual API response structure: { items: [...] }
        if ('items' in response && Array.isArray(response.items)) {
          recipes = response.items as Recipe[];
          pageInfo = {
            total: recipes.length,
            newCount: 0,
            limit: params.limit || 20,
            totalPages: 1,
            nextCursor: null // No pagination in current response
          };
        } else if ('data' in response && response.data) {
          const data = response.data as any;
          recipes = Array.isArray(data.recipes) ? data.recipes : [];
          pageInfo = data.pageInfo || {};
        } else if ('recipes' in response) {
          recipes = Array.isArray(response.recipes) ? response.recipes : [];
          pageInfo = response.pageInfo || {};
        }
      }
      
      setState(prev => ({
        ...prev,
        recipes: reset ? recipes : [...prev.recipes, ...recipes],
        hasNextPage: !!pageInfo.nextCursor,
        nextCursor: pageInfo.nextCursor || null,
        total: pageInfo.total || 0,
        newCount: pageInfo.newCount || 0,
        loading: false,
        loadingMore: false,
        error: null,
      }));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled
      }
      
      const searchError = error instanceof Error ? error : new Error('검색 중 오류가 발생했습니다.');
      
      setState(prev => ({
        ...prev,
        loading: false,
        loadingMore: false,
        error: searchError,
      }));
      
      onError?.(searchError);
    }
  }, [initialLimit, state.nextCursor, onError]);
  
  const loadMore = useCallback(() => {
    if (!state.hasNextPage || state.loadingMore || state.loading || !state.query.trim()) {
      return;
    }
    
    search(state.query, false);
  }, [state.hasNextPage, state.loadingMore, state.loading, state.query, search]);
  
  const reset = useCallback(() => {
    setState({
      query: '',
      recipes: [],
      loading: false,
      loadingMore: false,
      hasNextPage: false,
      nextCursor: null,
      error: null,
      total: 0,
      newCount: 0,
    });
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  return {
    ...state,
    search,
    loadMore,
    reset,
  };
}

// Hook for infinite scroll
export function useInfiniteScroll(
  loadMore: () => void,
  hasNextPage: boolean,
  loading: boolean,
  threshold = 0.9
) {
  useEffect(() => {
    const handleScroll = () => {
      if (!hasNextPage || loading) return;
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      if (scrollPercentage >= threshold) {
        loadMore();
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, hasNextPage, loading, threshold]);
}
