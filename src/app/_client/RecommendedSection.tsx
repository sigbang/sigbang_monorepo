"use client";
import Section from '@/components/Section';
import { useRecommendedFeed } from '@/lib/hooks/feed';

function getImageUrl(recipe: { thumbnailImage?: string; thumbnailUrl?: string; thumbnailPath?: string }) {
  const thumb = recipe.thumbnailImage || recipe.thumbnailUrl || recipe.thumbnailPath;
  if (!thumb) return '';
  if (/^https?:/i.test(thumb)) return thumb;
  const clean = thumb.startsWith('/') ? thumb.slice(1) : thumb;
  return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
}

export default function RecommendedSection() {
  const recommended = useRecommendedFeed(6);
  const items = (recommended.data?.pages.flatMap((p) => p.recipes) ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    image: getImageUrl(r),
    minutes: r.cookingTime,
    description: r.description,
    likesCount: r.likesCount,
    liked: r.isLiked,
    saved: r.isSaved,
    authorAvatar: r.author?.profileImage ?? '',
    authorId: r.author?.id,
    stepImages: ((r?.steps as any[]) || [])
      .map((s: any) => (s?.imageUrl || s?.imagePath) as string | undefined)
      .filter(Boolean)
      .map((u: string) => {
        if (/^https?:/i.test(u)) return u;
        const clean = u.startsWith('/') ? u.slice(1) : u;
        return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
      })
      .slice(0, 3) as string[],
    // Pass through for Section's link logic
    slug: r.slug,
    region: r.region,
    slugPath: r.slugPath,
  }));

  return (
    <Section title="추천" items={items} loading={recommended.status === 'pending'} />
  );
}


