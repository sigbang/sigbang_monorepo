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

export async function createRecipe(dto: CreateRecipeDto) {
  const { data } = await api.post('/recipes', dto, { timeout: 120000 });
  return data.id as string;
}

export async function updateRecipe(id: string, dto: CreateRecipeDto) {
  await api.put(`/recipes/${id}`, dto);
}

export async function aiGenerate(params: { imagePath?: string; title?: string }) {
  const { data } = await api.post('/recipes/ai/generate', params);
  return data;
}


