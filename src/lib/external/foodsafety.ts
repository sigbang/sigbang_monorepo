import type { RecipeDetail } from '@/lib/api/recipes';

type CookRcpRow = {
  RCP_SEQ?: string;
  RCP_NM?: string;
  RCP_WAY2?: string;
  RCP_PAT2?: string;
  HASH_TAG?: string;
  ATT_FILE_NO_MAIN?: string;
  ATT_FILE_NO_MK?: string;
  RCP_PARTS_DTLS?: string;
  RCP_NA_TIP?: string;
  [k: string]: any; // MANUALxx, MANUAL_IMGxx 등
};

export function toRecipeDetail(row: CookRcpRow): RecipeDetail {
  const seq = String(row.RCP_SEQ ?? '').trim();
  const title = String(row.RCP_NM ?? '').trim();

  const tip = String(row.RCP_NA_TIP ?? '').trim();
  const sourceLine = '출처: 식품안전나라 공공데이터 (http://www.foodsafetykorea.go.kr)';
  const description = [tip, sourceLine].filter((s) => s && s.length > 0).join('\n');

  const steps = Array.from({ length: 20 }).flatMap((_, i) => {
    const n = String(i + 1).padStart(2, '0');
    const text = String(row[`MANUAL${n}`] ?? '').replace(/\s+/g, ' ').trim();
    const img = String(row[`MANUAL_IMG${n}`] ?? '').trim();
    return text ? [{ order: i + 1, description: text, imagePath: img || undefined }] : [];
  });

  const safeSteps = steps.length ? steps : [{ order: 1, description: '상세 조리법은 원문을 참고하세요.' }];

  // Ingredients: remove trailing commas, split by comma into separate lines
  const rawIngredients = String(row.RCP_PARTS_DTLS ?? '');
  const ingredientsFormatted = rawIngredients
    .split(',')
    .map((part) => part.replace(/,+$/g, '').trim())
    .filter((part) => part.length > 0)
    .join('\n');

  return {
    id: seq || `import:${Date.now()}`,
    title,
    description: description || undefined,
    ingredients: ingredientsFormatted || undefined,
    cookingTime: 30,
    servings: null,
    difficulty: null,
    thumbnailImage: null,
    thumbnailUrl: (row.ATT_FILE_NO_MK || row.ATT_FILE_NO_MAIN || undefined) as string | undefined,
    thumbnailPath: null,
    linkTitle: undefined,
    linkUrl: undefined,
    steps: safeSteps,
    author: null,
    likesCount: null,
    isBookmarked: null,
    isSaved: null,
    isLiked: null,
    viewCount: null,
    commentsCount: null,
    savesCount: null,
  } as RecipeDetail;
}


