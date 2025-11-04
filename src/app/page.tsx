"use client";
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import Section from '@/components/Section';
import MobileNav from '@/components/MobileNav';
import { useT } from '@/i18n/I18nProvider';
import { useRef } from 'react';
import { useHotkeys } from '@/hooks/useHotkeys';
import { usePopularFeed, useRecommendedFeed } from '@/lib/hooks/feed';
import Footer from '@/components/Footer';
 

export default function Home() {
  const t = useT();
  
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
    authorId: r.author?.id,
    stepImages: ((r as any).steps || [])
      .map((s: any) => (s?.imageUrl || s?.imagePath) as string | undefined)
      .filter(Boolean)
      .map((u: string) => {
        if (/^https?:/i.test(u)) return u;
        const clean = u.startsWith('/') ? u.slice(1) : u;
        return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
      })
      .slice(0, 3) as string[]
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
    authorId: r.author?.id,
    stepImages: ((r as any).steps || [])
      .map((s: any) => (s?.imageUrl || s?.imagePath) as string | undefined)
      .filter(Boolean)
      .map((u: string) => {
        if (/^https?:/i.test(u)) return u;
        const clean = u.startsWith('/') ? u.slice(1) : u;
        return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
      })
      .slice(0, 3) as string[]
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
          <Section title={t('sections.now')} items={nowItems} loading={popular.status === 'pending'} />
          <div className="h-[24px]" />
          <Section title={t('sections.recommend')} items={recommendItems} loading={recommended.status === 'pending'} />          
        </main>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}
