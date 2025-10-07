'use client';
import Topbar from '@/components/Topbar';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useRecipe, useToggleLike, useToggleSave } from '@/lib/hooks/recipes';
import { IconBookmark, IconHeart } from '@/components/icons';

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { data: recipe, status } = useRecipe(id);
  const likeMut = useToggleLike(id);
  const saveMut = useToggleSave(id);

  const imageUrl = useMemo(() => {
    const thumb = recipe?.thumbnailImage || recipe?.thumbnailUrl || recipe?.thumbnailPath;
    if (!thumb) return '';
    if (/^https?:/i.test(thumb)) return thumb;
    const clean = thumb.startsWith('/') ? thumb.slice(1) : thumb;
    // Prefer local media route so it works even if API host is down
    return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
  }, [recipe]);

  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[1200px] flex">
        <Sidebar />
        <main id="main" className="flex-1 px-6 py-6" role="main">
          {status === 'pending' && <div>로딩...</div>}
          {status === 'error' && <div>오류가 발생했습니다</div>}
          {status === 'success' && recipe && (
            <article aria-labelledby="recipe-title" className="max-w-[720px] mx-auto">
              <button onClick={() => router.back()} className="text-[14px] text-[#666] hover:text-[#111] flex items-center gap-1">
                <span aria-hidden>←</span> 뒤로가기
              </button>
              <header className="mt-3">
                <div className="flex items-center gap-2 text-[13px] text-[#666]">
                  {recipe.author?.image ? (
                    <img src={recipe.author.image} alt="작성자" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#ddd]" />
                  )}
                  <span>{recipe.author?.name ?? '작성자'}</span>
                </div>
                <h1 id="recipe-title" className="mt-2 text-[22px] font-bold text-[#111]">{recipe.title}</h1>
              </header>

              <div className="mt-4 rounded-xl overflow-hidden border border-[#eee] bg-white">
                {imageUrl ? (
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
                    <Image src={imageUrl} alt={recipe.title} fill sizes="(max-width: 1024px) 100vw, 720px" style={{ objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: '100%', aspectRatio: '16 / 9' }} className="bg-[#f3f4f6]" />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[13px] text-[#666]">
                    {recipe.cookingTime != null && <div>⏱ {recipe.cookingTime}분</div>}
                    {recipe.servings != null && <div>🍽 {recipe.servings}인분</div>}
                    {recipe.difficulty && <div>⚙ {recipe.difficulty}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => likeMut.mutate(true)}
                        disabled={likeMut.isPending}
                        className="flex items-center gap-1 px-3 py-2 rounded-full border border-[#eee] hover:bg-amber-50"
                        aria-label="좋아요"
                        title="좋아요"
                      >
                        <IconHeart className="text-rose-500" />
                        <span className="text-[13px] text-[#333]">{recipe.likesCount ?? 0}</span>
                      </button>
                      <button
                        onClick={() => saveMut.mutate(!(recipe.isBookmarked ?? false))}
                        disabled={saveMut.isPending}
                        className={(recipe.isBookmarked ? 'bg-amber-400 text-white ' : 'border border-[#eee] hover:bg-amber-50 ') + 'px-3 py-2 rounded-full flex items-center gap-1'}
                        aria-label="북마크"
                        title="북마크"
                      >
                        <IconBookmark />
                        <span className="text-[13px]">저장</span>
                      </button>
                    </div>
                  </div>
                  {recipe.description && <p className="mt-3 text-[14px] text-[#333] whitespace-pre-wrap">{recipe.description}</p>}
                </div>
              </div>

              {recipe.linkUrl && (
                <div className="mt-6 border-t border-[#eee] pt-4">
                  <Link href={recipe.linkUrl} target="_blank" className="text-[14px] text-sky-700 underline">
                    재료 구매 하러 가기{recipe.linkTitle ? ` - ${recipe.linkTitle}` : ''}
                  </Link>
                </div>
              )}

              {recipe.ingredients && (
                <section className="mt-6">
                  <h2 className="text-[16px] font-semibold">재료</h2>
                  <div className="mt-2 text-[14px] text-[#333] whitespace-pre-wrap">{recipe.ingredients}</div>
                </section>
              )}

              {recipe.steps && recipe.steps.length > 0 && (
                <section className="mt-8">
                  <h2 className="text-[16px] font-semibold">요리 순서</h2>
                  <ol className="mt-3 flex flex-col gap-6">
                    {recipe.steps.map((s) => {
                      const stepImage = (() => {
                        const p = s.imagePath;
                        if (!p) return '';
                        if (/^https?:/i.test(p)) return p;
                        const clean = p.startsWith('/') ? p.slice(1) : p;
                        return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
                      })();
                      return (
                        <li key={s.order} className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-[12px] font-bold shrink-0">{s.order}</div>
                          <div className="flex-1">
                            <div className="text-[14px] text-[#333] whitespace-pre-wrap">{s.description}</div>
                            {stepImage && (
                              <div className="mt-2 relative w-full" style={{ aspectRatio: '16 / 9' }}>
                                <Image src={stepImage} alt="조리 이미지" fill sizes="(max-width: 1024px) 100vw, 720px" style={{ objectFit: 'cover', borderRadius: 12 }} />
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              )}
            </article>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}


