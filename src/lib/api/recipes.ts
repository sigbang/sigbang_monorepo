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

// Detail types and API
export type RecipeDetail = {
  id: string;
  title: string;
  description?: string | null;
  ingredients?: string | null;
  cookingTime?: number | null;
  servings?: number | null;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  thumbnailImage?: string | null;
  thumbnailUrl?: string | null;
  thumbnailPath?: string | null;
  linkTitle?: string | null;
  linkUrl?: string | null;
  steps?: { order: number; description: string; imagePath?: string | null }[];
  author?: { id: string; name?: string | null; image?: string | null } | null;
  likesCount?: number | null;
  isBookmarked?: boolean | null;
};

export async function getRecipe(id: string): Promise<RecipeDetail> {
  const { data } = await api.get(`/recipes/${id}`);
  const raw: any = data?.data ?? data;
  const mapped: RecipeDetail = {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? undefined,
    ingredients: raw.ingredients ?? undefined,
    cookingTime: typeof raw.cookingTime === 'number' ? raw.cookingTime : undefined,
    servings: typeof raw.servings === 'number' ? raw.servings : undefined,
    difficulty: raw.difficulty ? (String(raw.difficulty).toLowerCase() as 'easy' | 'medium' | 'hard') : null,
    thumbnailImage: raw.thumbnailImage ?? undefined,
    thumbnailUrl: raw.thumbnailUrl ?? undefined,
    thumbnailPath: raw.thumbnailPath ?? undefined,
    linkTitle: raw.linkTitle ?? undefined,
    linkUrl: raw.linkUrl ?? undefined,
    steps: Array.isArray(raw.steps)
      ? raw.steps.map((s: any) => ({
          order: s.order,
          description: s.description,
          imagePath: s.imagePath ?? s.imageUrl ?? null,
        }))
      : [],
    author: raw.author
      ? {
          id: raw.author.id,
          name: (raw.author.nickname ?? raw.author.name ?? null) as string | null,
          image: (raw.author.profileImage ?? raw.author.image ?? null) as string | null,
        }
      : null,
    likesCount: typeof raw.likesCount === 'number' ? raw.likesCount : undefined,
    isBookmarked: typeof raw.isBookmarked === 'boolean' ? raw.isBookmarked : (typeof raw.isSaved === 'boolean' ? raw.isSaved : null),
  };
  return mapped;
}

// Like / Save APIs
export async function likeRecipe(id: string) {
  await api.post(`/recipes/${id}/likes`);
}

export async function unlikeRecipe(id: string) {
  await api.delete(`/recipes/${id}/likes`);
}

export async function saveRecipe(id: string) {
  await api.post(`/recipes/${id}/bookmarks`);
}

export async function unsaveRecipe(id: string) {
  await api.delete(`/recipes/${id}/bookmarks`);
}


