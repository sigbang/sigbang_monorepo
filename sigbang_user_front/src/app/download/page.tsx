import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";

export const dynamic = 'force-dynamic';

export default function DownloadPage() {
  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[1200px] flex">
        <Sidebar />
        <main
          id="main"
          className="flex-1 px-4 sm:px-6 pt-6 pb-32 sm:pb-6"
          role="main"
        >
          <div className="w-full max-w-[720px] mx-auto rounded-2xl border border-[#eee] bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-semibold text-[#111]">다운로드</h1>
            <p className="mt-3 text-[14px] text-[#555]">
              모바일 앱과 데스크탑 앱은 준비 중입니다. 곧 만나보세요!
            </p>
          </div>
        </main>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}


