"use client";

import Topbar from '@/components/Topbar';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import { useExploreFeed } from '@/lib/hooks/feed';
import { useEffect, useMemo, useRef } from 'react';
import RecipeCard from '@/components/RecipeCard';
import RecipeCardSkeleton from '@/components/RecipeCardSkeleton';
import { ENV } from '@/lib/env';
import { toRecipeCardItem } from '@/lib/mappers/recipeCard';

export default function ExploreClient() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useExploreFeed(10);

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.recipes).map((r) => toRecipeCardItem(r as any)) ?? [],
    [data],
  );

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
                <li key={idx} className="max-w-[520px] w-full min-w-0 mx-auto py-6 border-b border-[#e5e7eb] last:border-b-0">
                  <RecipeCardSkeleton />
                </li>
              ))}
            </ul>
          )}
          {status === 'error' && <div>오류가 발생했습니다</div>}
          {status === 'success' && (
            <div>
              <ul className="flex flex-col">
                {items.map((it) => {
                  const slugPath = (() => {
                    const s = it.slug;
                    const g = it.region;
                    return it.slugPath || (s && s.includes('/') ? s : g && s ? `${g}/${s}` : it.id);
                  })();
                  return (
                    <li
                      key={it.id}
                      className="max-w-[520px] w-full min-w-0 mx-auto py-6 border-b border-[#e5e7eb] last:border-b-0"
                    >
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
              <div ref={sentinelRef} className="h-10" />
              {isFetchingNextPage && (
                <ul className="flex flex-col">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <li key={idx} className="max-w-[520px] w-full min-w-0 mx-auto py-6 border-b border-[#e5e7eb] last:border-b-0">
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


