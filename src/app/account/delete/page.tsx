"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { deleteMe } from "@/lib/api/users";
import { signOut, useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useMyProfile } from "@/lib/hooks/users";
import Image from "next/image";

export default function AccountDeletePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const me = useMyProfile();
  const qc = useQueryClient();
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userImageUrl = useMemo(() => {
    const src = (me.data?.image ?? (session?.user as { image?: string } | undefined)?.image) || '';
    if (!src) return '';
    if (/^https?:/i.test(src)) return src;
    const clean = src.startsWith('/') ? src.slice(1) : src;
    return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
  }, [me.data, session]);
  const userEmail = ((session?.user as { email?: string } | undefined)?.email || '').trim();
  const userName = ((me.data?.name || (session?.user as { name?: string } | undefined)?.name || '') as string).trim();

  const onConfirm = async () => {
    if (!agree || submitting) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      try { sessionStorage.setItem('suppress-login-modal', '1'); } catch {}
      await deleteMe();
      setMessage("탈퇴 처리되었습니다.");
      try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
      try { qc.clear(); } catch {}
      try { localStorage.removeItem('recipe:new:draft'); } catch {}
      try { sessionStorage.setItem('suppress-login-modal', '1'); } catch {}
      setTimeout(async () => {
        await signOut({ callbackUrl: "/account/deleted" });
      }, 1200);
    } catch {
      setError("탈퇴에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[1200px] flex">
        <Sidebar />
        <main id="main" className="flex-1 px-6 py-6" role="main">
          <div className="mx-auto max-w-[720px]">
            <h1 className="text-2xl font-semibold">회원 탈퇴</h1>

            <div className="mt-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[#eee] border border-[#ddd] relative">
                {userImageUrl ? (
                  <Image src={userImageUrl} alt="프로필" fill sizes="64px" style={{ objectFit: 'cover' }} />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
              <div>
                <div className="text-[18px] font-semibold">{userName || '사용자'}</div>
                {userEmail && <div className="text-[14px] text-[#666]">{userEmail}</div>}
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-[#eee] p-5 bg-white">
              <ul className="list-disc pl-5 space-y-2 text-[18px] text-[#444]">
                <li>계정 정보와 활동 데이터는 즉시 삭제됩니다.</li>
                <li>레시피 북마크 정보가 모두 지워집니다.</li>
                <li>작성한 레시피와 댓글은 노출되지 않습니다.</li>
                <li>탈퇴 후 동일 계정으로 30일간 재가입할 수 없습니다.</li>
              </ul>

              <label className="mt-5 flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  aria-label="탈퇴 안내에 모두 동의"
                />
                <span className="text-[18px]">
                  위 내용을 모두 확인하였으며 탈퇴에 동의합니다.
                </span>
              </label>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={!agree || submitting}
                  className={`inline-flex items-center rounded px-4 py-2 text-white ${
                    !agree || submitting ? "opacity-60 bg-red-500" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {submitting ? "탈퇴 처리중..." : "확인"}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="text-sm text-gray-600 hover:underline"
                >
                  취소
                </button>
              </div>

              {message && (
                <div className="mt-4 text-sm text-green-600" role="status" aria-live="polite">
                  {message}
                </div>
              )}
              {error && (
                <div className="mt-4 text-sm text-red-600" role="alert">
                  {error}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
