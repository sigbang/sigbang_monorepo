'use client';
import Image from 'next/image';
import Link from 'next/link';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { IconClock, IconBookmark, IconHeart } from './icons';
import { toggleLike, toggleSave, getRecipe } from '@/lib/api/recipes';
import { useQueryClient } from '@tanstack/react-query';

type Props = {
  recipeId?: string;
  title: string;
  minutes?: number;
  image: string;
  description?: string;
  likesCount?: number;
  authorAvatar?: string;
  authorId?: string;
  liked?: boolean;
  active?: boolean;
  tabIndex?: number;
  href?: string;
  saved?: boolean;
  priority?: boolean;
  sizes?: string;
  stepImages?: string[];
  hoverPreview?: boolean;
  previewIntervalMs?: number;
  previewStartDelayMs?: number;
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
  { recipeId, title, minutes, image, description, likesCount, authorAvatar, authorId, liked, active, tabIndex, href, saved, priority, sizes, stepImages, hoverPreview, previewIntervalMs, previewStartDelayMs },
  ref
) {
  const [isLiked, setIsLiked] = useState<boolean>(!!liked);
  const [isSaved, setIsSaved] = useState<boolean>(!!saved);
  const [likeCount, setLikeCount] = useState<number>(likesCount ?? 0);
  const [busy, setBusy] = useState<{ like?: boolean; save?: boolean }>({});
  const qc = useQueryClient();
  const { status } = useSession();

  // Hover preview state
  const [isHovered, setIsHovered] = useState(false);
  const [previewFrame, setPreviewFrame] = useState(0);
  const [previewActive, setPreviewActive] = useState(false);
  const [frames, setFrames] = useState<string[]>(() => (stepImages || []).filter(Boolean).slice(0, 3));
  const intervalRef = useRef<number | null>(null);
  const startTimerRef = useRef<number | null>(null);
  const [canHover, setCanHover] = useState<boolean>(false);
  const framesRef = useRef<string[]>(frames);
  const enrichRequestedRef = useRef<boolean>(false);
  const [veil, setVeil] = useState(0); // 0~1
  const veilTimer1Ref = useRef<number | null>(null);
  const veilTimer2Ref = useRef<number | null>(null);

  // Normalize URL to support relative media paths
  const toUrl = (u: string) => {
    if (!u) return '';
    if (/^https?:/i.test(u)) return u;
    const clean = u.startsWith('/') ? u.slice(1) : u;
    return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
  };

  // Sync frames from props
  useEffect(() => {
    const next = (stepImages || []).filter(Boolean).slice(0, 3).map((u) => toUrl(u));
    setFrames(next);
  }, [stepImages]);

  // Keep a ref of frames for interval callback freshness
  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);

  useEffect(() => {
    // Enable only on devices that support hover and fine pointer (desktop)
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setCanHover(mq.matches);
    update();
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    } else {
      // Safari fallback
      mq.addListener(update);
      return () => mq.removeListener(update);
    }
  }, []);

  // Prefetch enrichment as soon as hovered (do not wait 2s)
  useEffect(() => {
    if (!isHovered || !hoverPreview || !canHover) return;
    if (framesRef.current.length >= 2) return;
    if (!recipeId) return;
    if (enrichRequestedRef.current) return;
    enrichRequestedRef.current = true;
    (async () => {
      try {
        const detail = await getRecipe(recipeId);
        const enriched = (detail.steps || [])
          .map((s) => s.imagePath as string | undefined)
          .filter(Boolean)
          .map((u) => toUrl(u as string))
          .slice(0, 3);
        if (enriched.length >= 2) {
          setFrames(enriched);
        }
      } catch {
        // ignore
      }
    })();
  }, [isHovered, hoverPreview, canHover, recipeId]);

  // Activate overlay after delay (do not tie to frames to avoid flicker)
  useEffect(() => {
    if (!(hoverPreview && canHover && isHovered)) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (startTimerRef.current) {
        clearTimeout(startTimerRef.current);
        startTimerRef.current = null;
      }
      setPreviewActive(false);
      setPreviewFrame(0);
      return;
    }
    startTimerRef.current = window.setTimeout(() => {
      setPreviewActive(true);
    }, Math.max(100, previewStartDelayMs ?? 2000));
    return () => {
      if (startTimerRef.current) {
        clearTimeout(startTimerRef.current);
        startTimerRef.current = null;
      }
    };
  }, [hoverPreview, canHover, isHovered, previewStartDelayMs]);

  // Frame cycling (separate effect so updating frames does not hide overlay)
  useEffect(() => {
    if (!previewActive) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const cycleMs = Math.max(1000, previewIntervalMs ?? 2200);
    const whiteFadeMs = 350; // veil fade-in/out duration
    intervalRef.current = window.setInterval(() => {
      // White veil in
      if (veilTimer1Ref.current) clearTimeout(veilTimer1Ref.current);
      if (veilTimer2Ref.current) clearTimeout(veilTimer2Ref.current);
      setVeil(1);
      veilTimer1Ref.current = window.setTimeout(() => {
        const len = Math.max(1, framesRef.current.length);
        setPreviewFrame((f) => (f + 1) % len);
      }, Math.floor(whiteFadeMs * 0.5));
      veilTimer2Ref.current = window.setTimeout(() => {
        setVeil(0);
      }, whiteFadeMs);
    }, cycleMs);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (veilTimer1Ref.current) {
        clearTimeout(veilTimer1Ref.current);
        veilTimer1Ref.current = null;
      }
      if (veilTimer2Ref.current) {
        clearTimeout(veilTimer2Ref.current);
        veilTimer2Ref.current = null;
      }
    };
  }, [previewActive, previewIntervalMs]);

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
    if (status !== 'authenticated') {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('open-login-modal'));
      return;
    }
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
    if (status !== 'authenticated') {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('open-login-modal'));
      return;
    }
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
      <div
        style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden', background: '#eee', position: 'relative' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {image ? (
          <Image src={image} alt={title} priority={!!priority} sizes={sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 520px"} fill placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
            이미지 없음
          </div>
        )}
        {hoverPreview && canHover && frames.length > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: previewActive ? 1 : 0,
              transition: 'opacity 300ms ease',
              pointerEvents: 'none',
              zIndex: 2,
              background: '#ffffff', // ensure base thumbnail never shows through
            }}
            aria-hidden="true"
          >
            {/* white veil for mid-transition to avoid base thumbnail peeking */}
            <div style={{ position: 'absolute', inset: 0, background: '#ffffff', opacity: veil, transition: 'opacity 300ms ease' }} />
            {(frames as string[]).map((src, idx, arr) => (
              <Image
                key={src}
                src={src}
                alt=""
                fill
                sizes={sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 520px"}
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
                style={{
                  objectFit: 'cover',
                  opacity: idx === (previewFrame % arr.length) ? 1 : 0,
                  transition: 'opacity 800ms ease',
                  willChange: 'opacity',
                }}
                loading={previewActive ? 'eager' : undefined}
                priority={false}
              />
            ))}
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
            authorId ? (
              <Link href={`/users/${authorId}`} aria-label="작성자 프로필로 이동" className="group">
                <span className="inline-block h-7 w-7 rounded-full overflow-hidden border border-[#eee] bg-[#f5f5f5] transition-shadow hover:ring-2 hover:ring-amber-300 focus-visible:ring-2 focus-visible:ring-amber-500 relative">
                  <Image src={authorAvatar} alt="작성자" fill sizes="28px" style={{ objectFit: 'cover' }} />
                </span>
              </Link>
            ) : (
              <span className="inline-block h-7 w-7 rounded-full overflow-hidden border border-[#eee] bg-[#f5f5f5] transition-shadow hover:ring-2 hover:ring-amber-300 relative">
                <Image src={authorAvatar} alt="작성자" fill sizes="28px" style={{ objectFit: 'cover' }} />
              </span>
            )
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


