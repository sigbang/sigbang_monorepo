import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import Section from '@/components/Section';
import MobileNav from '@/components/MobileNav';

export default function Home() {
  const nowItems: any[] = [];
  const recommendItems: any[] = [];

  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[1200px] flex">
        <Sidebar />
        <main id="main" className="flex-1 px-6 py-6" role="main">
          <div className="text-center mb-6">
            <div className="text-[14px] text-[#111] font-semibold">식방에 오신 것을 환영합니다!</div>
            <div className="text-[12px] text-[#777] mt-1">다양한 레시피를 둘러보세요</div>
          </div>
          <Section title="레시피 지금" items={nowItems} />
          <div className="h-[24px]" />
          <Section title="레시피 추천" items={recommendItems} highlightFirst />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
