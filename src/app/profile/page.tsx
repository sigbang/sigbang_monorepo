"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useMyFollowCounts, useMyProfile, useMyRecipes, useMySavedRecipes } from "@/lib/hooks/users";
import RecipeCard from "@/components/RecipeCard";

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

  const me = useMyProfile();
  const followCounts = useMyFollowCounts(me.data?.id);
  const recipes = useMyRecipes(12);
  const saved = useMySavedRecipes(12);

  const [tab, setTab] = useState<'recipes' | 'saved'>("recipes");

  const getImageUrl = (recipe: { thumbnailImage?: string; thumbnailUrl?: string; thumbnailPath?: string }) => {
    const thumb = recipe.thumbnailImage || recipe.thumbnailUrl || recipe.thumbnailPath;
    if (!thumb) return '';
    return /^https?:/.test(thumb) ? thumb : `${process.env.NEXT_PUBLIC_API_BASE_URL}/${thumb}`;
  };

  const items = useMemo(() => {
    const pages = tab === 'recipes' ? recipes.data?.pages : saved.data?.pages;
    return (pages?.flatMap((p) => p.recipes) ?? []).map((r) => ({ id: r.id, title: r.title, image: getImageUrl(r) }));
  }, [recipes.data, saved.data, tab]);

  const hasNextPage = tab === 'recipes' ? recipes.hasNextPage : saved.hasNextPage;
  const isFetchingNext = tab === 'recipes' ? recipes.isFetchingNextPage : saved.isFetchingNextPage;
  const fetchMore = tab === 'recipes' ? recipes.fetchNextPage : saved.fetchNextPage;

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

        <div className="mt-6 grid grid-cols-3 max-w-[520px]">
          <div className="text-center">
            <div className="text-[20px] font-bold">{me.data?.recipesCount ?? 0}</div>
            <div className="text-[12px] text-[#666] mt-1">레시피</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-bold">{followCounts.data?.followingCount ?? 0}</div>
            <div className="text-[12px] text-[#666] mt-1">팔로잉</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-bold">{followCounts.data?.followerCount ?? 0}</div>
            <div className="text-[12px] text-[#666] mt-1">팔로워</div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-8 border-b border-[#e5e7eb]">
            <button
              className={(tab === 'recipes' ? 'text-[#111] border-b-2 border-amber-400 ' : 'text-[#999] ') + 'py-2 text-[20px] font-bold'}
              onClick={() => setTab('recipes')}
            >
              레시피
            </button>
            <button
              className={(tab === 'saved' ? 'text-[#111] border-b-2 border-amber-400 ' : 'text-[#999] ') + 'py-2 text-[20px] font-bold'}
              onClick={() => setTab('saved')}
            >
              북마크
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((it) => (
              <RecipeCard key={it.id} title={it.title} image={it.image} />
            ))}
          </div>

          <div className="mt-6 text-center">
            {hasNextPage && (
              <button
                onClick={() => fetchMore()}
                disabled={isFetchingNext}
                className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-60"
              >
                {isFetchingNext ? '불러오는 중...' : '더 보기'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


