"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ProfileImageEditor from "@/components/ProfileImageEditor";
import { useMyProfile, useSetDefaultProfileImage, useUploadProfileImage } from "@/lib/hooks/users";

export default function ProfileImageModalPage() {
  const router = useRouter();
  const backdropRef = useRef<HTMLDivElement>(null);
  const { data: me } = useMyProfile();
  const setDefaultMut = useSetDefaultProfileImage();
  const uploadMut = useUploadProfileImage();
  const [selection, setSelection] = useState<
    { type: 'presets'; key: string } | { type: 'upload'; file: File } | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const busy = setDefaultMut.isPending || uploadMut.isPending;

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
      aria-busy={busy}
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
          <ProfileImageEditor onChange={setSelection} />
        </div>

        {error && (
          <div className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-[#eee] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm rounded-md border border-neutral-300 hover:bg-neutral-100"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!selection || busy}
            onClick={async () => {
              if (!selection || busy) return;
              setError(null);
              try {
                if (selection.type === 'presets') {
                  await setDefaultMut.mutateAsync(selection.key);
                } else {
                  await uploadMut.mutateAsync(selection.file);
                }
                router.back();
              } catch (e) {
                const msg = (e instanceof Error && e.message) ? e.message : '처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.';
                setError(msg);
              }
            }}
            className="px-4 py-2 text-sm rounded-md bg-black text-white disabled:opacity-60 inline-flex items-center gap-2"
          >
            {busy && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            {busy ? (selection?.type === 'upload' ? '업로드 중...' : '적용 중...') : '확인'}
          </button>
        </div>
      </div>
    </div>
  );
}


