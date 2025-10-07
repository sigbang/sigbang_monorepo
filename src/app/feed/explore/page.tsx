'use client';
import Topbar from '@/components/Topbar';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import { useExploreFeed } from '@/lib/hooks/feed';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';

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
              <h2 className="text-center text-[22px] font-bold mb-6">탐색</h2>
              <ul className="flex flex-col gap-10">
                {items.map((r) => {
                  const imageUrl = getImageUrl(r);
                  return (
                    <li key={r.id} className="max-w-[480px] mx-auto w-full">
                      <Link href={`/recipes/${r.id}`} className="border border-[#eee] rounded-xl overflow-hidden block" aria-label={`${r.title} 상세 보기`}>
                        {imageUrl ? (
                          <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
                            <Image
                              src={imageUrl}
                              alt=""
                              fill
                              sizes="(max-width: 1024px) 100vw, 480px"
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <div style={{ width: '100%', aspectRatio: '16 / 9' }} className="bg-[#f3f4f6]" />
                        )}
                        <div className="p-4">
                          <div className="text-[16px] font-semibold text-[#111]">{r.title}</div>
                          {r.description && <div className="mt-1 text-[13px] text-[#666]">{r.description}</div>}
                        </div>
                      </Link>
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


