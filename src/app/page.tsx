"use client";
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import Section from '@/components/Section';
import MobileNav from '@/components/MobileNav';
import { useT } from '@/i18n/I18nProvider';
import { useRef } from 'react';
import { useHotkeys } from '@/hooks/useHotkeys';
import { usePopularFeed, useRecommendedFeed } from '@/lib/hooks/feed';
import { useSession } from 'next-auth/react';
import AuthButtons from '@/components/AuthButtons';

export default function Home() {
  const t = useT();
  const { data: session, status } = useSession();
  const popular = usePopularFeed(6);
  const recommended = useRecommendedFeed(6);
  const getImageUrl = (recipe: { thumbnailImage?: string; thumbnailUrl?: string; thumbnailPath?: string }) => {
    const thumb = recipe.thumbnailImage || recipe.thumbnailUrl || recipe.thumbnailPath;
    if (!thumb) return '';
    if (/^https?:/i.test(thumb)) return thumb;
    const clean = thumb.startsWith('/') ? thumb.slice(1) : thumb;
    return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
  };
  const nowItems = (popular.data?.pages.flatMap((p) => p.recipes) ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    image: getImageUrl(r),
    minutes: r.cookingTime,
    description: r.description,
    likesCount: r.likesCount,
    liked: r.isLiked,
    saved: r.isSaved,
    authorAvatar: r.author?.profileImage ?? '',
    authorId: r.author?.id
  }));
  const recommendItems = (recommended.data?.pages.flatMap((p) => p.recipes) ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    image: getImageUrl(r),
    minutes: r.cookingTime,
    description: r.description,
    likesCount: r.likesCount,
    liked: r.isLiked,
    saved: r.isSaved,
    authorAvatar: r.author?.profileImage ?? '',
    authorId: r.author?.id
  }));
  const mainRef = useRef<HTMLElement>(null);

  useHotkeys({
    'g': () => mainRef.current?.focus(),
  });

  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[1200px] flex">
        <Sidebar />
        <main id="main" className="flex-1 px-6 py-6 focus:outline-none" role="main" tabIndex={-1} ref={mainRef}>
          <div className="text-center mb-6">
            <div className="text-[14px] text-[#111] font-semibold">{t('welcome.title')}</div>
            <div className="text-[12px] text-[#777] mt-1">{t('welcome.subtitle')}</div>
            {status !== 'loading' && (
              <div className="mt-3 text-[12px] text-[#555]">
                {session ? (
                  <span>{session.user?.name}님 환영합니다</span>
                ) : (
                  <span>로그인이 필요합니다</span>
                )}
              </div>
            )}
            <div className="mt-2">
              <AuthButtons />
            </div>
          </div>
          <Section title={t('sections.now')} items={nowItems} loading={popular.status === 'pending'} />
          <div className="h-[24px]" />
          <Section title={t('sections.recommend')} items={recommendItems} highlightFirst loading={recommended.status === 'pending'} />
          <div className="mt-4 flex gap-3">
            <a className="text-sm text-sky-600 hover:underline" href="/feed/popular">인기 더 보기</a>
            <a className="text-sm text-sky-600 hover:underline" href="/feed/recommended">추천 더 보기</a>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
