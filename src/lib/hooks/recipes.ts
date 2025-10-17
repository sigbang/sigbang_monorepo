'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRecipe, RecipeDetail, likeRecipe, unlikeRecipe, saveRecipe, unsaveRecipe } from '../api/recipes';

export function useRecipe(id: string | undefined) {
  return useQuery<{ data: RecipeDetail }, Error, RecipeDetail>({
    queryKey: ['recipe', id],
    queryFn: async () => ({ data: await getRecipe(id as string) }),
    enabled: !!id,
    select: (res) => res.data,
  });
}

export function useToggleLike(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (next: boolean) => {
      if (!id) return;
      if (next) await likeRecipe(id);
      else await unlikeRecipe(id);
    },
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: ['recipe', id] });
      const prev = qc.getQueryData<RecipeDetail>(['recipe', id]);
      if (prev) {
        const before = !!(prev as any).isLiked;
        const delta = (next ? 1 : 0) - (before ? 1 : 0);
        qc.setQueryData<RecipeDetail>(['recipe', id], {
          ...prev,
          likesCount: Math.max(0, (prev.likesCount ?? 0) + delta),
          isLiked: next,
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['recipe', id], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['recipe', id] });
    },
  });
}

export function useToggleSave(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (next: boolean) => {
      if (!id) return;
      if (next) await saveRecipe(id);
      else await unsaveRecipe(id);
    },
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: ['recipe', id] });
      const prev = qc.getQueryData<RecipeDetail>(['recipe', id]);
      if (prev) {
        qc.setQueryData<RecipeDetail>(['recipe', id], {
          ...prev,
          isBookmarked: next,
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['recipe', id], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['recipe', id] });
    },
  });
}



