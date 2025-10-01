import { api } from './client';

export type StepDto = { order: number; description: string; imagePath?: string | null };
export type TagDto = { name: string; emoji?: string };

export type CreateRecipeDto = {
  title: string;
  description?: string;
  ingredients?: string;
  cookingTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  thumbnailPath?: string;
  linkTitle?: string;
  linkUrl?: string;
  steps?: StepDto[];
  tags?: TagDto[];
};

function toServerDto(dto: CreateRecipeDto) {
  const { difficulty, ...rest } = dto;
  return {
    ...rest,
    ...(difficulty ? { difficulty: difficulty.toUpperCase() } : {}),
  } as Record<string, unknown>;
}

export async function createRecipe(dto: CreateRecipeDto) {
  const { data } = await api.post('/recipes', toServerDto(dto), { timeout: 120000 });
  return data.id as string;
}

export async function updateRecipe(id: string, dto: CreateRecipeDto) {
  await api.put(`/recipes/${id}`, toServerDto(dto));
}

export async function aiGenerate(params: { imagePath?: string; title?: string }) {
  const { data } = await api.post('/recipes/ai/generate', params);
  return data;
}


