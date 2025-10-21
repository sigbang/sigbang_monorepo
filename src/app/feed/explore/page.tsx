'use client';
import Topbar from '@/components/Topbar';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import { useExploreFeed } from '@/lib/hooks/feed';
import { useEffect, useMemo, useRef } from 'react';
import RecipeCard from '@/components/RecipeCard';

export default function ExplorePage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useExploreFeed(10);

  const items = useMemo(() => data?.pages.flatMap((p) => p.recipes) ?? [], [data]);

  const getImageUrl = (recipe: any) => {
    const thumb = recipe.thumbnailImage || recipe.thumbnailUrl || recipe.thumbnailPath;
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
          {status === 'pending' && <div>로딩...</div>}
          {status === 'error' && <div>오류가 발생했습니다</div>}
          {status === 'success' && (
            <div>              
              <ul className="flex flex-col">
                {items.map((r) => {
                  const imageUrl = getImageUrl(r);
                  return (
                    <li key={r.id} className="max-w-[520px] w-full mx-auto py-6 border-b border-[#e5e7eb] last:border-b-0">
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
                      />
                    </li>
                  );
                })}
              </ul>
              <div ref={sentinelRef} className="h-10" />
              {isFetchingNextPage && <div className="text-center mt-4">불러오는 중...</div>}
            </div>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}


