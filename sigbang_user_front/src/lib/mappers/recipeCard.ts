import type { RecipeCardItem, RichRecipe } from '@/lib/types/recipeCard';

const toMediaUrl = (u?: string | null): string => {
  if (!u) return '';
  if (/^https?:/i.test(u)) return u;
  const clean = u.startsWith('/') ? u.slice(1) : u;
  return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
};

export function toRecipeCardItem(r: RichRecipe): RecipeCardItem {
  const thumb = r.thumbnailImage ?? r.thumbnailUrl ?? r.thumbnailPath ?? '';
  const image = toMediaUrl(thumb);

  const stepImages =
    ((r.steps as any[]) || [])
      .map((s) => (s?.imageUrl ?? (s as any).imagePath) as string | undefined)
      .filter((u): u is string => Boolean(u))
      .map((u) => toMediaUrl(u))
      .slice(0, 3);

  return {
    id: r.id,
    title: r.title,
    image,
    minutes: r.cookingTime,
    description: r.description,
    likesCount: r.likesCount,
    viewCount: r.viewCount,
    liked: (r as any).isLiked,
    saved: (r as any).isSaved,
    authorAvatar: r.author?.profileImage ?? '',
    authorId: r.author?.id,
    stepImages,
    slug: (r as any).slug,
    region: (r as any).region,
    slugPath: (r as any).slugPath,
  };
}


