import Topbar from '@/components/Topbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import Sidebar from '@/components/Sidebar';

export const dynamic = 'force-dynamic';

export default function FeedbackPage() {
  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[1200px] flex">
        <Sidebar />
        <main id="main" className="flex-1 px-6 py-6" role="main" tabIndex={-1}>
          <div className="mx-auto max-w-[800px]">
            <h1 className="text-2xl font-semibold">의견 보내기</h1>
            <p className="mt-2 text-gray-600 text-sm">서비스 개선을 위해 소중한 의견을 남겨 주시면 선물을 드립니다.</p>
            <FeedbackForm />
          </div>
        </main>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}

