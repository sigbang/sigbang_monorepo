'use client';
import Topbar from '@/components/Topbar';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import { useExploreFeed } from '@/lib/hooks/feed';
import { useEffect, useMemo, useRef } from 'react';
import RecipeCard from '@/components/RecipeCard';
import RecipeCardSkeleton from '@/components/RecipeCardSkeleton';
import { ENV } from '@/lib/env';

export default function ExplorePage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useExploreFeed(10);

  const items = useMemo(() => data?.pages.flatMap((p) => p.recipes) ?? [], [data]);

  const getImageUrl = (recipe: { thumbnailImage?: string }) => {
    const thumb = recipe.thumbnailImage;
    if (!thumb) return '';
    if (/^https?:/i.test(thumb)) return thumb;
    const clean = thumb.startsWith('/') ? thumb.slice(1) : thumb;
    return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
  };

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[1200px] flex">
        <Sidebar />
        <main id="main" className="flex-1 px-6 py-6" role="main">
          {status === 'pending' && (
            <ul className="flex flex-col">
              {Array.from({ length: 6 }).map((_, idx) => (
                <li key={idx} className="max-w-[520px] w-full mx-auto py-6 border-b border-[#e5e7eb] last:border-b-0">
                  <RecipeCardSkeleton />
                </li>
              ))}
            </ul>
          )}
          {status === 'error' && <div>오류가 발생했습니다</div>}
          {status === 'success' && (
            <div>
              <ul className="flex flex-col">
                {items.map((r) => {
                  const imageUrl = getImageUrl(r);
                  const slugPath = (() => { const s = (r as any).slug as string | undefined; const g = (r as any).region as string | undefined; return (r as any).slugPath || (s && s.includes('/') ? s : (g && s ? `${g}/${s}` : r.id)); })();
                  return (
                    <li key={r.id} className="max-w-[520px] w-full mx-auto py-6 border-b border-[#e5e7eb] last:border-b-0">
                      <RecipeCard
                        recipeId={r.id}
                        href={`/recipes/${slugPath}`}
                        title={r.title}
                        image={imageUrl}
                        minutes={r.cookingTime}
                        description={r.description}
                        likesCount={r.likesCount}
                        liked={r.isLiked}
                        saved={r.isSaved}
                        authorAvatar={r.author?.profileImage}
                        authorId={r.author?.id}
                      />
                    </li>
                  );
                })}
              </ul>
              {(() => {
                const base = ENV.SITE_URL;
                const itemUrls = items.map((r) => {
                  const s = (r as any).slug as string | undefined;
                  const g = (r as any).region as string | undefined;
                  const p = (r as any).slugPath || (s && s.includes('/') ? s : (g && s ? `${g}/${s}` : r.id));
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
              <div ref={sentinelRef} className="h-10" />
              {isFetchingNextPage && (
                <ul className="flex flex-col">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <li key={idx} className="max-w-[520px] w-full mx-auto py-6 border-b border-[#e5e7eb] last:border-b-0">
                      <RecipeCardSkeleton />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}


