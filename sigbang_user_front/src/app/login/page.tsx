"use client";

import Image from "next/image";
import { useCallback } from "react";
import Link from "next/link";

export default function LoginPage() {
  const handleGoogle = useCallback(async () => {
    // Full-page redirect to OAuth redirect endpoint (no popup/One Tap/FedCM)
    if (typeof window !== 'undefined') {
      window.location.assign(`${window.location.origin}/api/auth/google/redirect`);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center">
      <main className="flex-1 w-full flex flex-col items-center justify-start mt-24 px-4">
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="hidden md:block">
              <div className="mx-16 relative w-full rounded-2xl overflow-hidden bg-[#f0f0f0]" style={{ aspectRatio: '4 / 3' }}>
                <Image
                  src="/login/hero_login.jpg"
                  alt="식방 소개 이미지"
                  fill
                  sizes="(min-width: 1040px) 520px, (min-width: 768px) 50vw, 0px"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-4 md:h-8" />
              <Link href="/" className="flex items-center gap-2" aria-label="식방 홈">
                <Image src="/logo.png" alt="식방" width={52} height={52} />
              </Link>
              <div className="h-6 md:h-8" />
              <h1 className="text-[28px] md:text-[32px] font-bold text-left">나만의 추천 레시피를 발견하세요.</h1>
              <h2 className="text-[16px] md:text-[18px] text-left">세상의 모든 레시피 식방</h2>
              <div className="h-4 md:h-6" />
              <div className="w-full max-w-[420px] rounded-2xl bg-[#f6f6f6] p-6">
                <button
                  onClick={handleGoogle}
                  className="w-full h-[56px] rounded-md bg-white border border-neutral-500 text-black flex items-center justify-center gap-3 text-[18px] transition-all hover:bg-neutral-50 hover:border-neutral-600 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 active:translate-y-px"
                >
                  <Image src="/login/google_login.png" alt="Google" width={22} height={22} />
                  <span>Google로 계속하기</span>
                </button>
                <button
                  onClick={() => alert('준비중입니다.')}
                  className="mt-4 w-full h-[56px] rounded-md bg-white border border-neutral-500 text-black flex items-center justify-center gap-3 text-[18px] transition-all hover:bg-neutral-50 hover:border-neutral-600 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 active:translate-y-px"
                >
                  <Image src="/login/email_login.png" alt="Google" width={22} height={22} />
                  <span>메일로 계속하기 (준비중)</span>
                </button>
              </div>              
              <div className="mt-10 mb-24 text-[16px] text-[#777]">
                <Link href="/legal/terms" className="hover:underline">서비스 약관</Link>
                <span className="mx-2">·</span>
                <Link href="/legal/privacy" className="hover:underline">개인정보처리 방침</Link>
                </div>            
            </div>
          </div>          
        </div>                
      </main>
    </div>
  );
}



