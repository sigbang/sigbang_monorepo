import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import MobileNav from '@/components/MobileNav';
import Footer from '@/components/Footer';
import RecommendedSection from './_client/RecommendedSection';
import PopularSection from './_client/PopularSection';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export const metadata = {
  title: '식방 - 인기/추천 레시피',
  description: '세상의 모든 레시피를 발견하고 저장하세요.',
  alternates: { canonical: '/' },
  openGraph: { type: 'website', url: '/', title: '식방', description: '인기/추천 레시피', images: [{ url: '/og.png' }] },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
} as const;

export default function Home() {
  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[1200px] flex items-start">
        <Sidebar />
        <main
          id="main"
          className="flex-1 px-4 sm:px-6 pt-6 pb-32 sm:pb-6"
          role="main"
          tabIndex={-1}
        >
          <PopularSection />
          <div className="h-[24px]" />
          <RecommendedSection />
        </main>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}
