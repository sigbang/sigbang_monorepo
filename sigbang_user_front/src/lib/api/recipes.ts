import { api, unwrap } from './client';
import { SearchResponse } from '../types/recipe';

export type StepDto = { order: number; description: string; imagePath?: string | null };
export type TagDto = { name: string; emoji?: string };

export type RecipeTextModerationPayload = {
  title: string;
  description?: string;
  ingredients?: string;
  steps?: { order: number; description: string }[];
};

export type RecipeTextModerationResult = {
  allowed: boolean;
  isRecipe: boolean;
  recipeScore: number;
  isHarmful: boolean;
  harmfulReasons?: string[];
  shortFeedback?: string;
};

export type RecipeImageModerationPayload = {
  thumbnailPath: string;
  stepImagePaths?: string[];
};

export type RecipeImageModerationPerImageResult = {
  index: number;
  path: string;
  isHarmful: boolean;
  isFoodLike: boolean;
  reasons?: string[];
};

export type RecipeImageModerationResult = {
  allowed: boolean;
  isFoodLike: boolean;
  isHarmful: boolean;
  harmfulReasons?: string[];
  shortFeedback?: string;
  perImage?: RecipeImageModerationPerImageResult[];
};

export type CreateRecipeDto = {
  title: string;
  description?: string;
  ingredients?: string;
  cookingTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  thumbnailPath?: string;
  thumbnailCrop?: { x: number; y: number; width: number; height: number };
  linkTitle?: string;
  linkUrl?: string;
  steps?: StepDto[];
  tags?: TagDto[];
  source?: string;
};

function toServerDto(dto: CreateRecipeDto) {
  const { difficulty, ...rest } = dto;
  return {
    ...rest,
    ...(difficulty ? { difficulty: difficulty.toUpperCase() } : {}),
  } as Record<string, unknown>;
}

export async function moderateRecipeText(
  payload: RecipeTextModerationPayload,
): Promise<RecipeTextModerationResult> {
  const { data } = await api.post('/recipes/ai/moderate-text', payload);
  const raw: any = (data && (data as any).data) ? (data as any).data : data;

  const isRecipe =
    typeof raw?.isRecipe === 'boolean'
      ? raw.isRecipe
      : typeof raw?.is_recipe === 'boolean'
      ? raw.is_recipe
      : false;

  const isHarmful =
    typeof raw?.isHarmful === 'boolean'
      ? raw.isHarmful
      : typeof raw?.is_harmful === 'boolean'
      ? raw.is_harmful
      : false;

  const scoreSrc = typeof raw?.recipeScore === 'number'
    ? raw.recipeScore
    : typeof raw?.recipe_score === 'number'
    ? raw.recipe_score
    : 0;

  const recipeScore = Number.isFinite(scoreSrc) ? scoreSrc : 0;

  const reasonsSrc = raw?.harmfulReasons ?? raw?.harmful_reasons;
  const harmfulReasons: string[] | undefined = Array.isArray(reasonsSrc)
    ? reasonsSrc.map((r: any) => String(r)).filter((s: string) => !!s)
    : undefined;

  const fbSrc = raw?.shortFeedback ?? raw?.short_feedback;
  const shortFeedback: string | undefined =
    typeof fbSrc === 'string' ? fbSrc : undefined;

  return {
    allowed: !!raw?.allowed && !isHarmful && isRecipe && recipeScore >= 0.4,
    isRecipe,
    recipeScore,
    isHarmful,
    harmfulReasons,
    shortFeedback,
  };
}

export async function moderateRecipeImages(
  payload: RecipeImageModerationPayload,
): Promise<RecipeImageModerationResult> {
  const { data } = await api.post('/recipes/ai/moderate-images', payload);
  const raw: any = (data && (data as any).data) ? (data as any).data : data;

  const isFoodLike =
    typeof raw?.isFoodLike === 'boolean'
      ? raw.isFoodLike
      : typeof raw?.is_food_like === 'boolean'
      ? raw.is_food_like
      : false;

  const isHarmful =
    typeof raw?.isHarmful === 'boolean'
      ? raw.isHarmful
      : typeof raw?.is_harmful === 'boolean'
      ? raw.is_harmful
      : false;

  const reasonsSrc = raw?.harmfulReasons ?? raw?.harmful_reasons;
  const harmfulReasons: string[] | undefined = Array.isArray(reasonsSrc)
    ? reasonsSrc.map((r: any) => String(r)).filter((s: string) => !!s)
    : undefined;

  const fbSrc = raw?.shortFeedback ?? raw?.short_feedback;
  const shortFeedback: string | undefined =
    typeof fbSrc === 'string' ? fbSrc : undefined;

  const perImageSrc = raw?.perImage ?? raw?.per_image;
  const perImage: RecipeImageModerationPerImageResult[] | undefined = Array.isArray(perImageSrc)
    ? perImageSrc.map((item: any, idx: number) => ({
        index: typeof item.index === 'number' ? item.index : idx,
        path: String(item.path ?? ''),
        isHarmful: !!item.isHarmful || !!item.is_harmful,
        isFoodLike: !!item.isFoodLike || !!item.is_food_like,
        reasons: Array.isArray(item.reasons)
          ? item.reasons.map((r: any) => String(r)).filter((s: string) => !!s)
          : undefined,
      }))
    : undefined;

  return {
    allowed: !!raw?.allowed && !isHarmful && isFoodLike,
    isFoodLike,
    isHarmful,
    harmfulReasons,
    shortFeedback,
    perImage,
  };
}

export async function createRecipe(dto: CreateRecipeDto): Promise<{ id: string; thumbnailImage?: string }> {
  const { data } = await api.post('/recipes', toServerDto(dto), { timeout: 120000 });
  const raw: any = (data && (data as any).data) ? (data as any).data : data;
  return { id: String(raw.id), thumbnailImage: raw.thumbnailImage };
}

export async function updateRecipe(id: string, dto: CreateRecipeDto): Promise<{ thumbnailImage?: string }> {
  const { data } = await api.put(`/recipes/${id}`, toServerDto(dto));
  const raw: any = (data && (data as any).data) ? (data as any).data : data;
  return { thumbnailImage: raw?.thumbnailImage };
}

export async function aiGenerate(params: { imagePath?: string; title?: string }) {
  const { data } = await api.post('/recipes/ai/generate', params);
  return data;
}

export async function aiNormalizeIngredients(params: { raw: string; locale?: string }): Promise<string> {
  const { data } = await api.post('/recipes/ai/normalize-ingredients', {
    raw: params.raw,
    locale: params.locale ?? 'ko',
  });
  const body: any = (data && (data as any).data) ? (data as any).data : data;
  const normalized = body?.normalized ?? body?.ingredients ?? body?.result ?? body?.text ?? '';
  return String(normalized ?? '');
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
  isBookmarked?: boolean | null; // backward compatibility
  isSaved?: boolean | null;
  isLiked?: boolean | null;
  viewCount?: number | null;
  commentsCount?: number | null;
  savesCount?: number | null;
};

export function mapRecipeDetail(raw: any): RecipeDetail {
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
    likesCount: typeof raw.likesCount === 'number' ? raw.likesCount : (typeof raw._counts?.likes === 'number' ? raw._counts.likes : undefined),
    viewCount: typeof raw.viewCount === 'number' ? raw.viewCount : undefined,
    commentsCount: typeof raw.commentsCount === 'number' ? raw.commentsCount : undefined,
    isSaved: typeof raw.isSaved === 'boolean' ? raw.isSaved : (typeof raw.isBookmarked === 'boolean' ? raw.isBookmarked : null),
    isBookmarked: typeof raw.isBookmarked === 'boolean' ? raw.isBookmarked : (typeof raw.isSaved === 'boolean' ? raw.isSaved : null),
    isLiked:
      typeof raw.isLiked === 'boolean'
        ? raw.isLiked
        : typeof raw.liked === 'boolean'
        ? raw.liked
        : typeof raw.isLikedByMe === 'boolean'
        ? raw.isLikedByMe
        : null,
    savesCount: typeof raw.savesCount === 'number' ? raw.savesCount : undefined,
  };
  return mapped;
}

export async function getRecipe(id: string): Promise<RecipeDetail> {
  const { data } = await api.get(`/recipes/${id}`);
  const raw: any = (data && (data as any).data) ? (data as any).data : data;
  return mapRecipeDetail(raw);
}

// Like / Save toggle APIs
export type ToggleLikeResponse = { message?: string; isLiked: boolean; likesCount: number };
export type ToggleSaveResponse = { message?: string; isSaved: boolean; savesCount: number };

export async function toggleLike(id: string): Promise<ToggleLikeResponse> {
  const { data } = await api.post(`/recipes/${id}/like`);
  return unwrap<ToggleLikeResponse>(data);
}

export async function toggleSave(id: string): Promise<ToggleSaveResponse> {
  const { data } = await api.post(`/recipes/${id}/save`);
  return unwrap<ToggleSaveResponse>(data);
}

// Delete / Report APIs
export async function deleteRecipe(id: string) {
  await api.delete(`/recipes/${id}`);
}

export async function reportRecipe(id: string, reason?: string) {
  await api.post(`/recipes/${id}/reports`, { reason });
}

export type ExternalLinkEventPayload = {
  type: 'RENDERED' | 'CLICKED';
  actionType?: string;
  isAutoRedirect?: boolean;
  url?: string;
  finalUrl?: string;
};

export async function logRecipeExternalLinkEvent(
  recipeId: string,
  payload: ExternalLinkEventPayload,
) {
  const { data } = await api.post(
    `/recipes/${recipeId}/external-link-events`,
    payload,
  );
  return unwrap<{ success: boolean }>(data);
}

// Search API
export type SearchParams = {
  q: string;
  limit?: number;
  cursor?: string;
};

export async function searchRecipes(params: SearchParams): Promise<SearchResponse> {
  const { q, limit = 20, cursor } = params;
  
  const queryParams: Record<string, string> = {
    q,
    limit: limit.toString(),
  };
  
  if (cursor && cursor.trim() !== '') {
    queryParams.cursor = cursor;
  }
  
  const { data } = await api.get('/recipes/search', { params: queryParams });
  return unwrap<SearchResponse>(data);
}


