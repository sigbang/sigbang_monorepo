import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";
import Link from "next/link";
import WorldMarquee from "@/components/WorldMarquee";
export const metadata = {
  title: '식방 소개',
  description: '세상의 모든 레시피를 발견하고 저장하는 공간, 식방 소개',
  alternates: { canonical: '/about' },
  openGraph: { type: 'website', url: '/about', title: '식방 소개', description: '세상의 모든 레시피를 발견하고 저장하는 공간', images: [{ url: '/og.png' }] },
};

export const dynamic = 'force-static';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Topbar />
      <main id="main" className="" role="main">
        {/* Hero */}
        <section className="px-6 py-16 sm:py-20 bg-white border-b border-[#eee]">
          <div className="mx-auto max-w-[1100px]">
            <div className="max-w-[820px]">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#111]">세상의 모든 레시피</h1>
              <p className="mt-3 inline-block rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-sm font-medium">오픈베타 2025. 12. 01</p>
              <p className="mt-4 text-[16px] sm:text-[18px] leading-7 text-[#444]">
                사용자와 함께 만들어 가는 레시피 서비스. 간편하게 찾고, 저장하고, 공유하세요.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/" className="inline-flex items-center justify-center rounded-md bg-amber-400 hover:bg-amber-500 text-black px-5 py-3 text-[15px] font-semibold">
                  서비스 이동
                </Link>
                <Link href="/download" className="inline-flex items-center justify-center rounded-md border border-[#555] hover:bg-gray-200 px-5 py-3 text-[15px]">
                  다운로드
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="px-8 py-28 sm:py-18 bg-amber-400">
          <div className="mx-auto max-w-[1100px]">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111]">새로운 레시피 경험을 제공하는 식방</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border-2 border-[#555] bg-white p-6">
                <div className="text-l font-semibold">01.</div>
                <h3 className="mt-2 text-2xl font-semibold">레시피 발견</h3>
                <p className="mt-2 text-[16px] text-[#555]">다양한 레시피 발견을 제공</p>
              </div>
              <div className="rounded-2xl border-2 border-[#555] bg-white p-6">
                <div className="text-l font-semibold">02.</div>
                <h3 className="mt-2 text-2xl font-semibold">추천 레시피</h3>
                <p className="mt-2 text-[16px] text-[#555]">나만의 맞춤 레시피 추천</p>
              </div>
              <div className="rounded-2xl border-2 border-[#555] bg-white p-6">
                <div className="text-l font-semibold">03.</div>
                <h3 className="mt-2 text-2xl font-semibold">웰니스와 미식</h3>
                <p className="mt-2 text-[16px] text-[#555]">건강하면서 맛있는 레시피 탐색</p>
              </div>
            </div>
          </div>
        </section>

        {/* World cuisine gallery */}
        <section id="world" className="px-6 py-14 sm:py-20 bg-gray-200 border-y border-[#eee]">
          <div className="mx-auto max-w-[1100px]">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111]">다양한 레시피 데이터</h2>
            <p className="mt-3 text-[18px] text-[#555] max-w-[800px]">세상의 모든 레시피 경험</p>
            <div className="mt-10">
              <WorldMarquee
                images={[
                  { src: '/world/1.jpg', alt: '1' },
                  { src: '/world/2.jpg', alt: '2' },
                  { src: '/world/3.jpg', alt: '3' },
                  { src: '/world/4.jpg', alt: '4' },
                  { src: '/world/5.jpg', alt: '5' },
                  { src: '/world/6.jpg', alt: '6' },
                  { src: '/world/7.jpg', alt: '7' },
                  { src: '/world/8.jpg', alt: '8' },                  
                  { src: '/world/9.jpg', alt: '9' },                  
                  { src: '/world/10.jpg', alt: '10' },                  
              ]}
              />
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="px-6 py-14 sm:py-18">
          <div className="mx-auto max-w-[1100px]">
            <h2 className="sr-only">식방의 가치</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#555] bg-white p-6">
                <h3 className="text-xl font-semibold">간편한 레시피</h3>
                <p className="mt-2 text-[16px] text-[#555]">쉽고 간단한 레시피로 누구나 손쉽게 요리할 수 있도록 돕습니다.</p>
              </div>
              <div className="rounded-2xl border border-[#555] bg-white p-6">
                <h3 className="text-xl font-semibold">맞춤형 재료</h3>
                <p className="mt-2 text-[16px] text-[#555]">맞춤형 재료 기반 추천으로 건강한 식사를 제공합니다.</p>
              </div>
              <div className="rounded-2xl border border-[#555] bg-white p-6">
                <h3 className="text-xl font-semibold">다양한 선택</h3>
                <p className="mt-2 text-[16px] text-[#555]">전세계 다양한 요리로 지루함 없는 식사 경험을 보장합니다.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-16 sm:py-20 bg-amber-400 border-t border-[#eee]">
          <div className="mx-auto max-w-[1100px] flex flex-col items-start">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111]">식방과 새로운 레시피를 경험하세요</h2>
            <div className="mt-6 flex gap-3">
              <Link href="/" className="inline-flex items-center justify-center rounded-md bg-black hover:bg-gray-500 text-white px-5 py-3 text-[15px] font-semibold">
                레시피 보기
              </Link>              
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}


