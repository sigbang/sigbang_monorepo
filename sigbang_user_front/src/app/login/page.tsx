"use client";

import Image from "next/image";
import { useCallback } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleGoogle = useCallback(async () => {
    try {
      // Use Google One Tap / Credential via frontend, then post to our API
      // For now, redirect to native finalize flow which handles token handoff
      router.push('/auth/finalize');
    } catch {
      router.push('/auth/finalize');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center">
      <header className="w-full max-w-[1040px] px-4 py-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="식방" width={36} height={36} />
        </div>
      </header>
      <main className="flex-1 w-full flex flex-col items-center justify-start mt-10 px-4">
        <h1 className="text-[28px] font-bold">로그인</h1>
        <div className="mt-8 w-full max-w-[420px] rounded-2xl bg-[#f6f6f6] p-6">
          <button
            onClick={handleGoogle}
            className="w-full h-[56px] rounded-md bg-black text-white flex items-center justify-center gap-3 text-[18px]"
          >
            <span>Google로 계속하기</span>
          </button>
          <button
            disabled
            className="mt-4 w-full h-[56px] rounded-md bg-[#222] text-white/70 flex items-center justify-center gap-3 text-[18px] cursor-not-allowed"
          >
            <span>Apple로 계속하기</span>
          </button>
        </div>
        <div className="mt-10 text-[12px] text-[#777]">서비스 약관 및 개인정보처리 방침</div>
      </main>
    </div>
  );
}



