"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">로딩...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div>로그인이 필요합니다</div>
        <Link href="/login" className="text-sky-600 hover:underline">로그인 페이지로 이동</Link>
      </div>
    );
  }

  const name = (session.user as { name?: string } | undefined)?.name || "사용자";
  const email = (session.user as { email?: string } | undefined)?.email || "";
  const image = (session.user as { image?: string } | undefined)?.image || "";

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1040px] px-4 py-10">
        <h1 className="text-[24px] font-bold">프로필</h1>
        <div className="mt-6 flex items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-[#eee] border border-[#ddd]">
            {image ? (
              <img src={image} alt="아바타" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" />
            )}
          </div>
          <div>
            <div className="text-[18px] font-semibold">{name}</div>
            {email && <div className="text-[14px] text-[#666] mt-1">{email}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}


