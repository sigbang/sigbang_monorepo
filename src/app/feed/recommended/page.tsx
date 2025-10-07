'use client';
import { useRecommendedFeed } from '@/lib/hooks/feed';
import Image from 'next/image';
import Link from 'next/link';

export default function RecommendedPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useRecommendedFeed(10);

  if (status === 'pending') return <main style={{ padding: 24 }}>로딩...</main>;
  if (status === 'error') return <main style={{ padding: 24 }}>오류가 발생했습니다</main>;

  const items = data?.pages.flatMap((p) => p.recipes) ?? [];
  
  const getImageUrl = (recipe: any) => {
    const thumb = recipe.thumbnailImage || recipe.thumbnailUrl || recipe.thumbnailPath;
    if (!thumb) return '';
    if (/^https?:/i.test(thumb)) return thumb;
    const clean = thumb.startsWith('/') ? thumb.slice(1) : thumb;
    return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
  };

  return (
    <main style={{ padding: 24 }}>
      <h2>추천 레시피</h2>
      <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {items.map((r) => {
          const imageUrl = getImageUrl(r);
          return (
            <li key={r.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
              <Link href={`/recipes/${r.id}`} className="block" aria-label={`${r.title} 상세 보기`}>
                {imageUrl ? (
                  <div style={{ position: 'relative', width: '100%', height: 140 }}>
                    <Image
                      src={imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 220px"
                      style={{ objectFit: 'cover', borderRadius: 6 }}
                    />
                  </div>
                ) : (
                  <div style={{ width: '100%', height: 140, backgroundColor: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                    이미지 없음
                  </div>
                )}
                <div style={{ marginTop: 8, fontWeight: 600 }}>{r.title}</div>
                {r.description && <div style={{ color: '#666', marginTop: 4, fontSize: 14 }}>{r.description}</div>}
              </Link>
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


