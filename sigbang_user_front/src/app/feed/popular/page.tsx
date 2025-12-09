'use client';
import { usePopularFeed } from '@/lib/hooks/feed';
import RecipeCard from '@/components/RecipeCard';
import RecipeCardSkeleton from '@/components/RecipeCardSkeleton';
import { ENV } from '@/lib/env';
import { toRecipeCardItem } from '@/lib/mappers/recipeCard';

export default function PopularPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = usePopularFeed(10);

  if (status === 'pending') {
    return (
      <main style={{ padding: 24 }}>
        <h2>인기 레시피</h2>
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

  const recipes = data?.pages.flatMap((p) => p.recipes) ?? [];
  const items = recipes.map((r) => toRecipeCardItem(r as any));

  return (
    <main style={{ padding: 24 }}>
      <h2>인기 레시피</h2>
      <ul className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {items.map((it, idx) => {
          const slugPath = (() => {
            const s = it.slug;
            const g = it.region;
            return it.slugPath || (s && s.includes('/') ? s : g && s ? `${g}/${s}` : it.id);
          })();
          return (
            <li key={it.id}>
              <RecipeCard
                recipeId={it.id}
                href={`/recipes/${slugPath}`}
                title={it.title}
                image={it.image}
                minutes={it.minutes}
                description={it.description}
                likesCount={it.likesCount}
                viewCount={it.viewCount}
                liked={it.liked}
                saved={it.saved}
                authorAvatar={it.authorAvatar}
                authorId={it.authorId}
                priority={idx < 6}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 360px"
                hoverPreview={!!it.stepImages && it.stepImages.length > 0}
                stepImages={it.stepImages}
              />
            </li>
          );
        })}
      </ul>
      {(() => {
        const base = ENV.SITE_URL;
        const itemUrls = items.map((it) => {
          const s = it.slug;
          const g = it.region;
          const p = it.slugPath || (s && s.includes('/') ? s : g && s ? `${g}/${s}` : it.id);
          const rel = `/recipes/${p}`;
          return new URL(rel, base).toString();
        });
        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: itemUrls.map((url, idx) => ({ '@type': 'ListItem', position: idx + 1, url })),
        } as const;
        return (
          <script
            key="ld-itemlist"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        );
      })()}
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


