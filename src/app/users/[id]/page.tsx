'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Topbar from '@/components/Topbar';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import RecipeCard from '@/components/RecipeCard';
import { useMyProfile, useMyFollowCounts, useToggleFollow, useUserProfile, useUserRecipes } from '@/lib/hooks/users';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);
  const searchParams = useSearchParams();
  const me = useMyProfile();
  const profile = useUserProfile(userId);
  const counts = useMyFollowCounts(userId);
  const recipes = useUserRecipes(userId, 12);
  const [tab, setTab] = useState<'recipes'>('recipes');
  const toggle = useToggleFollow(userId);

  const isSelf = me.data?.id && userId === me.data.id;
  const mainRef = useRef<HTMLElement>(null);

  const displayName = useMemo(() => profile.data?.nickname ?? profile.data?.name ?? '사용자', [profile.data]);
  const avatar = useMemo(() => {
    const src = profile.data?.profileImage ?? profile.data?.image ?? '';
    if (!src) return '';
    if (/^https?:/i.test(src)) return src;
    const clean = src.startsWith('/') ? src.slice(1) : src;
    return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
  }, [profile.data]);
  const isFollowing = !!(profile.data?.relation?.isFollowing);
  const isFollowedBy = !!(profile.data?.relation?.isFollowedBy);

  const onFollowClick = async () => {
    if (isSelf) return;
    try {
      await toggle.mutateAsync(!isFollowing);
    } catch {}
  };

  // Sync tab from URL on mount and when query changes (recipes only)
  useEffect(() => {
    const t = (searchParams.get('tab') || 'recipes').toLowerCase();
    if (t === 'recipes') setTab('recipes');
  }, [searchParams]);

  // Helper to push tab into URL
  const gotoTab = (next: 'recipes') => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', next);
    router.replace(url.pathname + '?' + url.searchParams.toString());
    setTab(next);
  };

  const recipeItems = useMemo(() => {
    const pages = recipes.data?.pages ?? [];
    return pages.flatMap((p) => p.recipes).map((r) => {
      const thumb = r.thumbnailImage || r.thumbnailUrl || r.thumbnailPath || '';
      const image = /^https?:/i.test(thumb)
        ? thumb
        : thumb
        ? `/media/${thumb.startsWith('media/') ? thumb.slice('media/'.length) : (thumb.startsWith('/') ? thumb.slice(1) : thumb)}`
        : '';
      return {
        id: r.id,
        title: r.title,
        image,
        minutes: r.cookingTime,
        description: r.description,
        likesCount: r.likesCount,
        liked: r.isLiked,
        saved: r.isSaved,
        href: `/recipes/${r.id}`,
      };
    });
  }, [recipes.data]);

  const userList = (list: { pages?: Array<{ users?: any[] }> }) => {
    const pages = list.pages ?? [];
    return (pages.flatMap((p) => p.users ?? []) as any[]);
  };

  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[1200px] flex">
        <Sidebar />
        <main id="main" className="flex-1 px-6 py-6 focus:outline-none" role="main" tabIndex={-1} ref={mainRef}>
          {!profile.data && profile.status === 'pending' && (
            <div className="flex items-center justify-center h-[60vh]">로딩...</div>
          )}
          {profile.error && (
            <div className="flex items-center justify-center h-[60vh]">사용자를 찾을 수 없습니다</div>
          )}
          {profile.data && (
            <div>
              <div className="mt-6 flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-[#eee] border border-[#ddd]">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
                <div className="text-center">
                  <div className="text-[18px] font-semibold">{displayName}</div>
                  {profile.data?.email && <div className="text-[14px] text-[#666] mt-1 mb-6">{profile.data.email}</div>}
                </div>
                {!isSelf && (
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={onFollowClick}
                      className={
                        (isFollowing
                          ? 'bg-black text-white border border-black '
                          : 'bg-amber-400 text-black border border-black ')
                        + ' inline-flex items-center justify-center w-[140px] h-[40px] text-[14px] rounded-md disabled:opacity-50'
                      }
                      aria-pressed={isFollowing}
                    >
                      {isFollowing ? '팔로잉 취소' : '팔로잉 하기'}
                    </button>
                    {isFollowedBy && (
                      <span className="ml-1 text-[11px] text-[#6b7280]">맞팔</span>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-6 grid grid-cols-3 max-w-[520px] mx-auto">
                <div className="text-center">
                  <div className="text-[20px] font-bold">{profile.data?.recipesCount ?? 0}</div>
                  <div className="text-[12px] text-[#666] mt-1">레시피</div>
                </div>
                <div className="text-center">
                  <div className="text-[20px] font-bold">{counts.data?.followingCount ?? 0}</div>
                  <div className="text-[12px] text-[#666] mt-1">팔로잉</div>
                </div>
                <div className="text-center">
                  <div className="text-[20px] font-bold">{counts.data?.followerCount ?? 0}</div>
                  <div className="text-[12px] text-[#666] mt-1">팔로워</div>
                </div>
              </div>

              <div className="mt-16">
                <div className="flex items-center justify-center gap-64 border-b border-[#e5e7eb]">
                  <button
                    className={(tab === 'recipes' ? 'text-[#111] border-b-2 border-amber-400 ' : 'text-[#999] ') + 'py-2 text-[20px] font-bold'}
                    onClick={() => gotoTab('recipes')}
                  >
                    레시피
                  </button>
                </div>
              </div>

              {tab === 'recipes' && (
                <div className="mt-6 grid grid-cols-2 gap-6 max-w-[900px] mx-auto">
                  {recipeItems.map((r) => (
                    <RecipeCard key={r.id} recipeId={r.id} title={r.title} minutes={r.minutes} image={r.image} description={r.description} likesCount={r.likesCount} liked={r.liked} saved={r.saved} href={r.href} />
                  ))}
                </div>
              )}

              {/* Note: 북마크 탭 제거. 다른 유저는 레시피 탭만 표시 */}
            </div>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}


