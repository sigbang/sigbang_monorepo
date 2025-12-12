"use client";

import Topbar from '@/components/Topbar';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import Section from '@/components/Section';
import { useExploreFeed } from '@/lib/hooks/feed';
import { useEffect, useMemo, useRef } from 'react';
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
        <main
          id="main"
          className="flex-1 px-4 sm:px-6 pt-6 pb-32 sm:pb-6"
          role="main"
        >
          {status === 'pending' && (
            <ul className="flex flex-col">
              {Array.from({ length: 6 }).map((_, idx) => (
                <li key={idx} className="w-full min-w-0 py-6 border-b border-[#e5e7eb] last:border-b-0">
                  <RecipeCardSkeleton />
                </li>
              ))}
            </ul>
          )}
          {status === 'error' && <div>오류가 발생했습니다</div>}
          {status === 'success' && (
            <div>
              <Section title="탐색 레시피" items={items}>
                {/* Section 내부에서 RecipeCard를 사용해 홈과 동일한 레이아웃으로 렌더링 */}
              </Section>
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
                    <li key={idx} className="w-full min-w-0 py-6 border-b border-[#e5e7eb] last:border-b-0">
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


