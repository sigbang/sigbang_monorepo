'use client';
import { useRecommendedFeed } from '@/lib/hooks/feed';
import RecipeCard from '@/components/RecipeCard';
import RecipeCardSkeleton from '@/components/RecipeCardSkeleton';

export default function RecommendedPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useRecommendedFeed(10);

  if (status === 'pending') {
    return (
      <main style={{ padding: 24 }}>
        <h2>추천 레시피</h2>
        <ul className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {Array.from({ length: 12 }).map((_, idx) => (
            <li key={idx}>
              <RecipeCardSkeleton />
            </li>
          ))}
        </ul>
      </main>
    );
  }
  if (status === 'error') return <main style={{ padding: 24 }}>오류가 발생했습니다</main>;

  const items = data?.pages.flatMap((p) => p.recipes) ?? [];
  
  const getImageUrl = (recipe: { thumbnailImage?: string }) => {
    const thumb = recipe.thumbnailImage;
    if (!thumb) return '';
    if (/^https?:/i.test(thumb)) return thumb;
    const clean = thumb.startsWith('/') ? thumb.slice(1) : thumb;
    return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
  };

  return (
    <main style={{ padding: 24 }}>
      <h2>추천 레시피</h2>
      <ul className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {items.map((r, idx) => {
          const imageUrl = getImageUrl(r);
          return (
            <li key={r.id}>
              <RecipeCard
                recipeId={r.id}
                href={`/recipes/${r.id}`}
                title={r.title}
                image={imageUrl}
                minutes={r.cookingTime}
                description={r.description}
                likesCount={r.likesCount}
                liked={r.isLiked}
                saved={r.isSaved}
                authorAvatar={r.author?.profileImage}
                authorId={r.author?.id}
                priority={idx < 6}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 360px"
              />
            </li>
          );
        })}
      </ul>
      <div style={{ marginTop: 16 }}>
        {hasNextPage && (
          <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? '불러오는 중...' : '더 보기'}
          </button>
        )}
      </div>
    </main>
  );
}


