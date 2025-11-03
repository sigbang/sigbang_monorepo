import Link from "next/link";
import Image from "next/image";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export default function AccountDeletedPage() {
  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[1200px] flex">
        <Sidebar />
        <main id="main" className="flex-1 px-6 py-6" role="main">
          <div className="w-full max-w-[520px] mx-auto rounded-2xl border border-[#eee] bg-white p-8 text-center shadow-sm">
            <div className="flex items-center justify-center gap-3">
              <Image src="/logo.png" alt="식방" width={48} height={48} />
              <div className="text-2xl font-semibold">식방</div>
            </div>

            <div className="mt-6 text-[18px] text-[#111]">탈퇴처리 되었습니다.</div>
            <div className="mt-2 text-[14px] text-[#666]">그동안 이용해 주셔서 감사합니다.</div>

            <div className="mt-6 text-[14px] text-[#444]">비로그인도 서비스를 이용 할 수 있습니다.</div>

            <div className="mt-8">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded bg-black px-5 py-2 text-white hover:bg-gray-900"
              >
                홈으로
              </Link>
            </div>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}


