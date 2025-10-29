"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ProfileImageEditor from "@/components/ProfileImageEditor";
import { useMyProfile } from "@/lib/hooks/users";

export default function ProfileImageModalPage() {
  const router = useRouter();
  const backdropRef = useRef<HTMLDivElement>(null);
  const { data: me } = useMyProfile();

  const currentImage = (() => {
    const src = me?.image || "";
    if (!src) return "";
    if (/^https?:/i.test(src)) return src;
    const clean = src.startsWith("/") ? src.slice(1) : src;
    return `/media/${clean.startsWith("media/") ? clean.slice("media/".length) : clean}`;
  })();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") router.back(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-image-modal-title"
      onClick={(e) => { if (e.target === backdropRef.current) router.back(); }}
    >
      <div className="relative w-full max-w-[720px] rounded-2xl bg-white shadow-xl border border-[#ececec] p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-[#e5e7eb] bg-[#f5f5f5] relative">
              {currentImage ? (
                <Image src={currentImage} alt="현재 프로필" fill sizes="48px" style={{ objectFit: "cover" }} />
              ) : (
                <span className="absolute inset-0 bg-neutral-200" />
              )}
            </div>
            <div>
              <h2 id="profile-image-modal-title" className="text-[18px] font-semibold">프로필 이미지 변경</h2>
              <p className="text-[12px] text-[#666] mt-0.5">기본 제공 이미지 또는 직접 업로드로 변경할 수 있어요</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full border border-[#ddd] hover:bg-neutral-50 flex items-center justify-center"
            aria-label="닫기"
            title="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="mt-4">
          <ProfileImageEditor onDone={() => router.back()} />
        </div>
      </div>
    </div>
  );
}


