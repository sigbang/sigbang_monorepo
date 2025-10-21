'use client';
import Image from 'next/image';
import Link from 'next/link';
import { forwardRef, useState } from 'react';
import { IconClock, IconBookmark, IconHeart } from './icons';
import { toggleLike, toggleSave } from '@/lib/api/recipes';
import { useQueryClient } from '@tanstack/react-query';

type Props = {
  recipeId?: string;
  title: string;
  minutes?: number;
  image: string;
  description?: string;
  likesCount?: number;
  authorAvatar?: string;
  liked?: boolean;
  active?: boolean;
  tabIndex?: number;
  href?: string;
  saved?: boolean;
};

const BLUR_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9" width="320" height="180"><rect width="100%" height="100%" fill="#e5e7eb"/></svg>');

function formatCountShort(n?: number) {
  if (n == null) return '0';
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  if (n < 1000000) return Math.round(n / 1000) + 'K';
  return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
}

const RecipeCard = forwardRef<HTMLDivElement, Props>(function RecipeCard(
  { recipeId, title, minutes, image, description, likesCount, authorAvatar, liked, active, tabIndex, href, saved },
  ref
) {
  const [isLiked, setIsLiked] = useState<boolean>(!!liked);
  const [isSaved, setIsSaved] = useState<boolean>(!!saved);
  const [likeCount, setLikeCount] = useState<number>(likesCount ?? 0);
  const [busy, setBusy] = useState<{ like?: boolean; save?: boolean }>({});
  const qc = useQueryClient();

  const updateRecipeDetailCache = (updater: (r: Record<string, unknown>) => Record<string, unknown>) => {
    if (!recipeId) return;
    const key = ['recipe', recipeId];
    const old: unknown = qc.getQueryData(key);
    if (!old) return;
    const isContainer = !!old && typeof old === 'object' && 'data' in (old as Record<string, unknown>);
    const current: Record<string, unknown> | undefined = isContainer
      ? ((old as { data: Record<string, unknown> }).data as Record<string, unknown>)
      : ((old as Record<string, unknown> | undefined));
    if (!current) return;
    const updated = updater(current);
    qc.setQueryData(key, isContainer ? { ...(old as Record<string, unknown>), data: updated } : updated);
  };

  type ListPage = { recipes?: Array<Record<string, unknown>> };
  const updateQueriesByPrefix = (
    prefix: string,
    updater: (r: Record<string, unknown>) => Record<string, unknown>
  ) => {
    const entries = qc.getQueriesData<{ pages: ListPage[]; pageParams: unknown[] }>({ queryKey: [prefix] });
    for (const [key, data] of entries) {
      if (!data || typeof data !== 'object' || !('pages' in (data as unknown as Record<string, unknown>))) continue;
      const current = data as { pages: ListPage[]; pageParams: unknown[] };
      const patched = {
        ...current,
        pages: current.pages.map((p) => ({
          ...p,
          recipes: Array.isArray(p.recipes)
            ? p.recipes.map((rec) => ((rec as Record<string, unknown>)?.id === recipeId ? updater(rec as Record<string, unknown>) : rec))
            : p.recipes,
        })),
      };
      qc.setQueryData(key, patched);
    }
  };
  const updateListCaches = (updater: (r: Record<string, unknown>) => Record<string, unknown>) => {
    updateQueriesByPrefix('feed', updater);
    updateQueriesByPrefix('search', updater);
  };

  const onToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!recipeId || busy.like) return;
    setBusy((b) => ({ ...b, like: true }));
    const optimisticNext = !isLiked;
    setIsLiked(optimisticNext);
    setLikeCount((c) => Math.max(0, c + (optimisticNext ? 1 : -1)));
    updateListCaches((rec) => {
      const currentLikes = typeof rec['likesCount'] === 'number' ? (rec['likesCount'] as number) : 0;
      return {
        ...rec,
        isLiked: optimisticNext,
        likesCount: Math.max(0, currentLikes + (optimisticNext ? 1 : -1)),
      } as Record<string, unknown>;
    });
    updateRecipeDetailCache((rec) => {
      const currentLikes = typeof rec['likesCount'] === 'number' ? (rec['likesCount'] as number) : 0;
      return {
        ...rec,
        isLiked: optimisticNext,
        likesCount: Math.max(0, currentLikes + (optimisticNext ? 1 : -1)),
      } as Record<string, unknown>;
    });
    try {
      const res = await toggleLike(recipeId);
      setIsLiked(res.isLiked);
      setLikeCount(res.likesCount);
      updateListCaches((rec) => ({ ...rec, isLiked: res.isLiked, likesCount: res.likesCount }));
      updateRecipeDetailCache((rec) => ({ ...rec, isLiked: res.isLiked, likesCount: res.likesCount } as Record<string, unknown>));
    } catch {
      setIsLiked((prev) => !prev);
      setLikeCount((c) => Math.max(0, c + (isLiked ? 1 : -1)));
      updateListCaches((rec) => {
        const currentLikes = typeof rec['likesCount'] === 'number' ? (rec['likesCount'] as number) : 0;
        return {
          ...rec,
          isLiked: !optimisticNext,
          likesCount: Math.max(0, currentLikes + (optimisticNext ? -1 : 1)),
        } as Record<string, unknown>;
      });
      updateRecipeDetailCache((rec) => {
        const currentLikes = typeof rec['likesCount'] === 'number' ? (rec['likesCount'] as number) : 0;
        return {
          ...rec,
          isLiked: !optimisticNext,
          likesCount: Math.max(0, currentLikes + (optimisticNext ? -1 : 1)),
        } as Record<string, unknown>;
      });
    } finally {
      setBusy((b) => ({ ...b, like: false }));
    }
  };

  const onToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!recipeId || busy.save) return;
    setBusy((b) => ({ ...b, save: true }));
    const optimisticNext = !isSaved;
    setIsSaved(optimisticNext);
    updateListCaches((rec) => ({ ...rec, isSaved: optimisticNext, isBookmarked: optimisticNext }));
    updateRecipeDetailCache((rec) => ({ ...rec, isSaved: optimisticNext, isBookmarked: optimisticNext } as Record<string, unknown>));
    try {
      const res = await toggleSave(recipeId);
      setIsSaved(res.isSaved);
      updateListCaches((rec) => ({ ...rec, isSaved: res.isSaved, isBookmarked: res.isSaved }));
      updateRecipeDetailCache((rec) => ({ ...rec, isSaved: res.isSaved, isBookmarked: res.isSaved } as Record<string, unknown>));
    } catch {
      setIsSaved((prev) => !prev);
      updateListCaches((rec) => ({ ...rec, isSaved: !optimisticNext, isBookmarked: !optimisticNext }));
      updateRecipeDetailCache((rec) => ({ ...rec, isSaved: !optimisticNext, isBookmarked: !optimisticNext } as Record<string, unknown>));
    } finally {
      setBusy((b) => ({ ...b, save: false }));
    }
  };
  const content = (
    <div ref={ref} tabIndex={tabIndex} style={{ width: '100%' }} className={(active ? 'ring-6 ring-amber-200 ' : '') + 'rounded-[16px] focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white hover:ring-8 hover:ring-amber-200 hover:shadow-md transition-shadow'}>
      <div style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden', background: '#eee', position: 'relative' }}>
        {image ? (
          <Image src={image} alt={title} priority sizes="(max-width: 1024px) 50vw, 520px" fill placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
            이미지 없음
          </div>
        )}
      </div>
      <div className="px-1 pt-2 pb-1">
        <div className="text-[16px] font-semibold text-[#223]">{title}</div>
        {description && (
          <div className="mt-1 text-[13px] text-[#6b7280] truncate">{description}</div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[12px] text-[#666]">
            <IconClock />
            <span>{minutes ?? 60} mins</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onToggleLike} aria-pressed={isLiked} aria-label={isLiked ? '좋아요 취소' : '좋아요'} className="p-1 rounded-md hover:bg-[#f5f5f5] disabled:opacity-50" disabled={busy.like}>
              <IconHeart className={isLiked ? 'text-rose-500' : 'text-[#999]'} filled={isLiked} />
            </button>
            <button type="button" onClick={onToggleSave} aria-pressed={isSaved} aria-label={isSaved ? '저장 취소' : '저장'} className="p-1 rounded-md hover:bg-[#f5f5f5] disabled:opacity-50" disabled={busy.save}>
              <IconBookmark className={isSaved ? 'text-amber-500' : 'text-[#999]'} filled={isSaved} />
            </button>
          </div>
        </div>
      </div>
      <div className="px-1 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] text-[#6b7280]">
          <span>좋아요 {formatCountShort(likeCount)}</span>
        </div>
        <div className="flex items-center gap-2">
          {authorAvatar ? (
            <span className="inline-block h-7 w-7 rounded-full overflow-hidden border border-[#eee] bg-[#f5f5f5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={authorAvatar} alt="작성자" className="h-full w-full object-cover" />
            </span>
          ) : (
            <span className="inline-block h-7 w-7 rounded-full bg-[#e5e7eb]" aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block" aria-label={`${title} 상세 보기`}>
      {content}
    </Link>
  ) : (
    content
  );
});

export default RecipeCard;


