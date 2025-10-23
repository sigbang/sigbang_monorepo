'use client';
import { useMemo, useState } from 'react';
import { useToggleFollow } from '@/lib/hooks/users';
import type { PublicUser } from '@/lib/types/user';

type Props = {
  user: PublicUser;
  currentUserId?: string | null;
};

export default function UserListItem({ user, currentUserId }: Props) {
  const targetUserId = user.id;
  const isSelf = currentUserId && targetUserId === currentUserId;
  const initialFollowing = useMemo(() => {
    return !!(user.isFollowing ?? user.relation?.isFollowing);
  }, [user]);
  const isFollowedBy = !!(user.isFollowedBy ?? user.relation?.isFollowedBy);
  const [following, setFollowing] = useState<boolean>(initialFollowing);
  const [busy, setBusy] = useState<boolean>(false);
  const mut = useToggleFollow(targetUserId);

  const imgUrl = useMemo(() => {
    const src = user.profileImage ?? user.image ?? '';
    if (!src) return '';
    if (/^https?:/i.test(src)) return src;
    const clean = src.startsWith('/') ? src.slice(1) : src;
    return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
  }, [user]);

  const onToggle = async () => {
    if (busy || isSelf) return;
    const next = !following;
    setBusy(true);
    setFollowing(next);
    try {
      await mut.mutateAsync(next);
    } catch (e: unknown) {
      setFollowing((prev) => !prev);
      const message = e instanceof Error ? e.message : '팔로우 동작에 실패했습니다';
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-alert
        alert(message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-block h-10 w-10 rounded-full overflow-hidden border border-[#eee] bg-[#f5f5f5]">
          {imgUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrl} alt={user.nickname ?? user.name ?? '사용자'} className="h-full w-full object-cover" />
          ) : (
            <span className="inline-block h-full w-full bg-[#e5e7eb]" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-[#223] truncate">{user.nickname ?? user.name ?? '사용자'}</div>
          {isFollowedBy && (
            <div className="mt-0.5 text-[11px] text-[#6b7280]">맞팔</div>
          )}
        </div>
      </div>
      {!isSelf && (
        <button
          type="button"
          className={
            (following
              ? 'bg-black text-white border border-black '
              : 'bg-amber-400 text-black border border-black ')
            + ' inline-flex items-center justify-center w-[120px] h-[36px] text-[13px] rounded-md disabled:opacity-50'
          }
          onClick={onToggle}
          disabled={busy}
          aria-pressed={following}
        >
          {following ? '팔로잉 취소' : '팔로잉 하기'}
        </button>
      )}
    </div>
  );
}


