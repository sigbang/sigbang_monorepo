'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRecipe, RecipeDetail, toggleLike, toggleSave } from '../api/recipes';

export function useRecipe(id: string | undefined, initial?: RecipeDetail | null) {
  return useQuery<{ data: RecipeDetail }, Error, RecipeDetail>({
    queryKey: ['recipe', id],
    queryFn: async () => ({ data: await getRecipe(id as string) }),
    enabled: !!id,
    select: (res) => res.data,
    initialData: initial ? { data: initial } : undefined,
    // Always refetch on mount to ensure latest thumbnail/crop is reflected
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    // Do not keep detail fresh too long; we want most recent server state
    staleTime: 0,
  });
}

export function useToggleLike(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!id) return { isLiked: false, likesCount: 0 };
      return await toggleLike(id);
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['recipe', id] });
      const prev = qc.getQueryData(['recipe', id]);
      qc.setQueryData(['recipe', id], (old: unknown) => {
        const isContainer = !!old && typeof old === 'object' && 'data' in (old as Record<string, unknown>);
        const current: RecipeDetail | undefined = isContainer
          ? (old as { data: RecipeDetail }).data
          : (old as RecipeDetail | undefined);
        if (!current) return old as any;
        const before = !!current.isLiked;
        const next = !before;
        const delta = (next ? 1 : 0) - (before ? 1 : 0);
        const updated: RecipeDetail = {
          ...current,
          isLiked: next,
          likesCount: Math.max(0, (current.likesCount ?? 0) + delta),
        };
        return isContainer ? { ...(old as any), data: updated } : updated;
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['recipe', id], ctx.prev as any);
    },
    onSuccess: (res) => {
      qc.setQueryData(['recipe', id], (old: unknown) => {
        const isContainer = !!old && typeof old === 'object' && 'data' in (old as Record<string, unknown>);
        const current: RecipeDetail | undefined = isContainer
          ? (old as { data: RecipeDetail }).data
          : (old as RecipeDetail | undefined);
        if (!current || !res) return old as any;
        const updated: RecipeDetail = { ...current, isLiked: res.isLiked, likesCount: res.likesCount };
        return isContainer ? { ...(old as any), data: updated } : updated;
      });
    },
  });
}

export function useToggleSave(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!id) return { isSaved: false, savesCount: 0 };
      return await toggleSave(id);
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['recipe', id] });
      const prev = qc.getQueryData(['recipe', id]);
      qc.setQueryData(['recipe', id], (old: unknown) => {
        const isContainer = !!old && typeof old === 'object' && 'data' in (old as Record<string, unknown>);
        const current: RecipeDetail | undefined = isContainer
          ? (old as { data: RecipeDetail }).data
          : (old as RecipeDetail | undefined);
        if (!current) return old as any;
        const before = !!(current.isSaved ?? current.isBookmarked);
        const next = !before;
        const updated: RecipeDetail = { ...current, isSaved: next, isBookmarked: next };
        return isContainer ? { ...(old as any), data: updated } : updated;
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['recipe', id], ctx.prev as any);
    },
    onSuccess: (res) => {
      qc.setQueryData(['recipe', id], (old: unknown) => {
        const isContainer = !!old && typeof old === 'object' && 'data' in (old as Record<string, unknown>);
        const current: RecipeDetail | undefined = isContainer
          ? (old as { data: RecipeDetail }).data
          : (old as RecipeDetail | undefined);
        if (!current || !res) return old as any;
        const updated: RecipeDetail = { ...current, isSaved: res.isSaved, isBookmarked: res.isSaved };
        return isContainer ? { ...(old as any), data: updated } : updated;
      });
    },
  });
}



