import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import Section from '@/components/Section';
import MobileNav from '@/components/MobileNav';
import Footer from '@/components/Footer';
import { ENV } from '@/lib/env';
import RecommendedSection from './_client/RecommendedSection';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export const metadata = {
  title: '식방 - 인기/추천 레시피',
  description: '세상의 모든 레시피를 발견하고 저장하세요.',
  alternates: { canonical: '/' },
  openGraph: { type: 'website', url: '/', title: '식방', description: '인기/추천 레시피', images: [{ url: '/og.png' }] },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
} as const;

type FeedItem = {
  id: string;
  title: string;
  description?: string;
  cookingTime?: number;
  thumbnailImage?: string;
  thumbnailUrl?: string;
  thumbnailPath?: string;
  likesCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  author?: { id: string; profileImage?: string };
  steps?: Array<{ imageUrl?: string; imagePath?: string }>;
  slug?: string;
  region?: string;
  slugPath?: string;
};

function getImageUrl(r: FeedItem): string {
  const thumb = r.thumbnailImage || r.thumbnailUrl || r.thumbnailPath;
  if (!thumb) return '';
  if (/^https?:/i.test(thumb)) return thumb;
  const clean = thumb.startsWith('/') ? thumb.slice(1) : thumb;
  return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
}

function mapItems(raw: FeedItem[]) {
  return raw.map((r) => ({
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
    stepImages: (r.steps ?? [])
      .map((s) => s?.imageUrl || s?.imagePath)
      .filter(Boolean)
      .map((u) => {
        if (!u) return '';
        if (/^https?:/i.test(u)) return u;
        const clean = u.startsWith('/') ? u.slice(1) : u;
        return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
      })
      .slice(0, 3) as string[],
    slug: (r as any).slug,
    region: (r as any).region,
    slugPath: (r as any).slugPath,
  }));
}

async function fetchFeed(path: string, limit: number) {
  const api = ENV.API_BASE_URL.replace(/\/+$/, '');
  const url = `${api}${path}?limit=${limit}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [] as FeedItem[];
  const json: any = await res.json().catch(() => null);
  const list = (json?.data?.recipes ?? json?.recipes ?? []) as FeedItem[];
  return list;
}

export default async function Home() {
  const popularRaw = await fetchFeed('/feed/popular', 6);
  const nowItems = mapItems(popularRaw);

  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[1200px] flex">
        <Sidebar />
        <main id="main" className="flex-1 px-6 py-6" role="main" tabIndex={-1}>
          <Section title="지금 인기" items={nowItems} />
          <div className="h-[24px]" />
          <RecommendedSection />
        </main>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}
