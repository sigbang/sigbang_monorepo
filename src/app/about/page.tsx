import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[1200px] flex">
        <Sidebar />
        <main id="main" className="flex-1 px-6 py-6" role="main">
          <div className="w-full max-w-[720px] mx-auto rounded-2xl border border-[#eee] bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-semibold text-[#111]">서비스 소개</h1>
            <p className="mt-3 text-[14px] text-[#555]">
              식방은 나만의 레시피를 발견하고 저장하는 공간입니다. 더 편하게 검색하고,
              좋아요와 저장으로 나만의 컬렉션을 만들어 보세요.
            </p>
          </div>
        </main>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}


