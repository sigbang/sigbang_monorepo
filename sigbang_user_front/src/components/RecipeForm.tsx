'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { CreateRecipeDto, RecipeDetail } from '@/lib/api/recipes';
import { useHotkeys } from '@/hooks/useHotkeys';

const ImageUploader = dynamic(() => import('@/components/ImageUploader'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[16/9] rounded-md bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
  ),
});

const IngredientsEditor = dynamic(() => import('@/components/IngredientsEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-28 w-full rounded-md bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
  ),
});

const DiscreteSlider = dynamic(() => import('@/components/DiscreteSlider'), {
  ssr: false,
  loading: () => (
    <div className="h-6 w-full rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
  ),
});

const StepsEditor = dynamic(() => import('@/components/StepsEditor'), {
  ssr: false,
  loading: () => (
    <div className="space-y-3">
      <div className="h-24 rounded-md bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      <div className="h-24 rounded-md bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      <div className="h-24 rounded-md bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
    </div>
  ),
});

type StepDraft = { order: number; description: string; imagePath?: string | null; imageFile?: File };

type Props = {
  mode: 'create' | 'edit';
  initial?: RecipeDetail;
  onSubmit: (dto: CreateRecipeDto) => Promise<void>;
  onCancel: () => void;
  embedded?: boolean;
  onBusyChange?: (busy: boolean) => void;
};

export default function RecipeForm({ mode, initial, onSubmit, onCancel, embedded = false, onBusyChange }: Props) {
  const [stage, setStage] = useState(1);
  const [showStage1Errors, setShowStage1Errors] = useState(false);
  const [showStage2Errors, setShowStage2Errors] = useState(false);
  const [showStage3Errors, setShowStage3Errors] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDesc] = useState(initial?.description ?? '');
  const [ingredients, setIngr] = useState(initial?.ingredients ?? '');
  const prevInitialIngredientsRef = useRef<string>(initial?.ingredients ?? '');
  useEffect(() => {
    const nextInit = initial?.ingredients ?? '';
    const prevInit = prevInitialIngredientsRef.current ?? '';
    if (ingredients === prevInit && nextInit && nextInit !== prevInit) {
      setIngr(nextInit);
    }
    prevInitialIngredientsRef.current = nextInit;
  }, [initial?.ingredients]);
  
  // In edit mode: only use server-generated final thumbnail with one-time cache-bust
  // In create/import mode: allow external URL or existing server path as initial preview
  const getThumbnailPath = (recipe?: RecipeDetail) => {
    if (!recipe) return undefined;
    if (mode === 'edit') {
      const thumb = recipe.thumbnailImage;
      if (!thumb) return undefined;
      const toUrl = (s: string) => {
        if (/^https?:/i.test(s)) return s;
        const clean = s.startsWith('/') ? s.slice(1) : s;
        return `/media/${clean}`;
      };
      return `${toUrl(thumb)}?t=${Date.now()}`;
    }
    // create/import
    const thumb = recipe.thumbnailImage || recipe.thumbnailUrl || recipe.thumbnailPath;
    if (!thumb) return undefined;
    if (/^https?:/i.test(thumb)) return thumb;
    const clean = thumb.startsWith('/') ? thumb.slice(1) : thumb;
    return `/media/${clean}`;
  };
  
  const [thumbnailPath, setThumbPath] = useState<string | undefined>(getThumbnailPath(initial));
  const [thumbnailFile, setThumbFile] = useState<File | undefined>(undefined);
  const [thumbnailCrop, setThumbCrop] = useState<{ x: number; y: number; width: number; height: number } | undefined>(undefined);
  const [cookingTime, setCookingTime] = useState<number | undefined>(initial?.cookingTime ?? 30);
  // Helper function to resolve step image paths
  const getStepImagePath = (imagePath?: string | null) => {
    if (!imagePath) return undefined;
    // If it's already a full URL, return as-is
    if (/^https?:/i.test(imagePath)) return imagePath;
    // If it's already a media path, return as-is
    if (imagePath.startsWith('/media/')) return imagePath;
    // Otherwise, prepend /media/
    const clean = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `/media/${clean}`;
  };

  const [steps, setSteps] = useState<StepDraft[]>(
    initial?.steps && initial.steps.length > 0
      ? initial.steps.map((s) => ({ 
          order: s.order, 
          description: s.description, 
          imagePath: getStepImagePath(s.imagePath) 
        }))
      : [
          { order: 1, description: '' },
          { order: 2, description: '' },
          { order: 3, description: '' },
        ]
  );
  const [linkTitle, setLinkTitle] = useState(initial?.linkTitle ?? '');
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? '');
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string>('업로드 중...');

  useEffect(() => {
    // When switching to stage 3, ensure at least 3 steps exist for better UX
    if (stage === 3 && steps.length < 3) {
      setSteps((prev) => {
        const toAdd = Array.from({ length: 3 - prev.length }, (_v, i) => ({ order: prev.length + i + 1, description: '' }));
        return [...prev, ...toAdd];
      });
    }
  }, [stage, steps.length]);

  // Prefetch StepsEditor chunk while user is on stage 2 to minimize perceived delay
  useEffect(() => {
    if (stage === 2) {
      import('@/components/StepsEditor');
    }
  }, [stage]);

  const stage1Errors: { field: string; message: string }[] = [];
  if (!title || title.trim().length < 2) stage1Errors.push({ field: 'title', message: '제목 2자 이상 필요' });
  if (!thumbnailPath && !thumbnailFile) stage1Errors.push({ field: 'thumbnail', message: '대표 이미지 필요' });

  const stage2Errors: { field: string; message: string }[] = [];
  if (linkUrl && !/^https?:\/\/.+/.test(linkUrl)) stage2Errors.push({ field: 'linkUrl', message: '링크 URL 형식 오류' });

  const stage3Errors: { field: string; message: string }[] = [];
  if (steps.length === 0 || !steps[0].description.trim()) stage3Errors.push({ field: 'steps', message: '첫 단계 설명 필요' });

  const allErrors = [...stage1Errors, ...stage2Errors, ...stage3Errors];

  const canProceed = (fromStage: number) => {
    if (fromStage === 1) return stage1Errors.length === 0;
    if (fromStage === 2) return stage2Errors.length === 0;
    if (fromStage === 3) return stage3Errors.length === 0;
    return true;
  };

  const getErrorMessage = (e: unknown) => {
    try {
      const anyErr = e as any;
      const resp = anyErr?.response;
      const data = resp?.data;
      const msgFromData = typeof data === 'string'
        ? data
        : (data && typeof data === 'object' && 'message' in data ? String(data.message) : undefined);
      return msgFromData || (anyErr?.message ? String(anyErr.message) : String(e));
    } catch {
      return e instanceof Error ? e.message : String(e);
    }
  };

  const handleNext = () => {
    if (!canProceed(stage)) {
      if (stage === 1) setShowStage1Errors(true);
      else if (stage === 2) setShowStage2Errors(true);
      else setShowStage3Errors(true);
      return;
    }
    if (stage < 3) setStage(stage + 1);
  };

  const handlePrev = () => {
    if (stage > 1) setStage(stage - 1);
    else onCancel();
  };

  const submit = async () => {
    if (allErrors.length > 0) {
      setShowStage1Errors(true);
      setShowStage2Errors(true);
      setShowStage3Errors(true);
      return;
    }
    setBusy(true);
    setBusyLabel('레시피 업로드 중...');
    if (onBusyChange) onBusyChange(true);
    try {
      // 1) 썸네일 및 스텝 이미지 업로드
      let finalThumbnailPath = thumbnailPath;
      if (thumbnailFile) {
        const { uploadFile } = await import('@/lib/api/media');
        finalThumbnailPath = await uploadFile(thumbnailFile, { kind: 'thumbnail' });
        setThumbPath(finalThumbnailPath);
      } else if (thumbnailPath && /^https?:/i.test(thumbnailPath)) {
        try {
          const res = await fetch(thumbnailPath);
          const blob = await res.blob();
          const contentType = blob.type || 'image/jpeg';
          const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : contentType.includes('gif') ? 'gif' : contentType.includes('heic') ? 'heic' : contentType.includes('heif') ? 'heif' : 'jpg';
          const file = new File([blob], `thumbnail.${ext}`, { type: contentType });
          const { uploadFile } = await import('@/lib/api/media');
          finalThumbnailPath = await uploadFile(file, { kind: 'thumbnail' });
          setThumbPath(finalThumbnailPath);
        } catch {
          // keep original path if download fails
        }
      }

      const stepsWithUploaded: { order: number; description: string; imagePath?: string | null }[] = [];
      if (steps && steps.length) {
        const { uploadFile } = await import('@/lib/api/media');
        for (const s of steps) {
          let imagePath = s.imagePath ?? undefined;
          if (s.imageFile) imagePath = await uploadFile(s.imageFile as File);
          stepsWithUploaded.push({ order: s.order, description: s.description, imagePath: imagePath ?? undefined });
        }
      }

      // 2) 백엔드 업로드 API에서 텍스트/이미지 유해성 검증을 모두 수행
      setBusyLabel('레시피 저장 중...');
      const dto: CreateRecipeDto = {
        title: title.trim(),
        description: description.trim(),
        ingredients: ingredients.trim(),
        thumbnailPath: finalThumbnailPath,
        ...(thumbnailCrop ? { thumbnailCrop } : {}),
        cookingTime,
        steps: stepsWithUploaded.filter((s) => s.description.trim()),
        ...(linkTitle ? { linkTitle } : {}),
        ...(linkUrl ? { linkUrl } : {}),
      };
      await onSubmit(dto);
    } catch (e: unknown) {
      const anyErr: any = e;
      const respData = anyErr?.response?.data;
      const code = respData?.code;
      const msg = respData?.message;

      if (code === 'TEXT_MODERATION_BLOCKED' || code === 'IMAGE_MODERATION_BLOCKED') {
        alert(msg ?? '커뮤니티 가이드라인에 맞지 않는 내용이 포함되어 있어 업로드할 수 없습니다.');
      } else {
        alert(`처리 실패: ${getErrorMessage(e)}`);
      }
    } finally {
      setBusy(false);
      if (onBusyChange) onBusyChange(false);
    }
  };

  useHotkeys({
    'Ctrl+Enter': (e) => {
      e.preventDefault();
      if (stage === 3) submit();
      else handleNext();
    },
    'Escape': (e) => {
      e.preventDefault();
      handlePrev();
    },
  });

  const card = (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-[820px] max-h-[90vh] overflow-hidden flex flex-col relative">
      <div className="border-b border-neutral-200 dark:border-neutral-800 p-2">
        <div className="relative mb-2">
          <h1 id="recipe-form-title" className="text-xl font-semibold text-center">
            {mode === 'create' ? '레시피 등록' : '레시피 수정'}
          </h1>
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {stage === 1 && (
          <>
            <ImageUploader
              value={thumbnailPath}
              file={thumbnailFile}
              onFileChange={(f) => setThumbFile(f)}
              onCropChange={(crop: { x: number; y: number; width: number; height: number } | undefined) => setThumbCrop(crop)}
              maxBytes={10 * 1024 * 1024}
              onOversize={mode === 'edit' ? async (file) => {
                const { resizeImageToMaxBytes } = await import('@/lib/image/resize');
                return await resizeImageToMaxBytes(file, 10 * 1024 * 1024, { mimeType: 'image/jpeg' });
              } : undefined}
              error={showStage1Errors ? stage1Errors.find((e) => e.field === 'thumbnail')?.message : undefined}
            />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="recipe-title" className="block text-sm font-medium">
                  제목 <span className="text-red-500">*</span>
                </label>
                {showStage1Errors && stage1Errors.find((e) => e.field === 'title') && (
                  <span className="text-xs text-red-600 dark:text-red-400">{stage1Errors.find((e) => e.field === 'title')!.message}</span>
                )}
              </div>
              <input
                id="recipe-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 간장 계란밥"
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md"
                maxLength={60}
              />
            </div>
            <div>
              <label htmlFor="recipe-description" className="block text-sm font-medium mb-1">
                설명
              </label>
              <textarea
                id="recipe-description"
                value={description}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                placeholder="레시피에 대한 간단한 설명을 입력하세요"
                maxLength={500}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md resize-none"
              />
            </div>
          </>
        )}

        {stage === 2 && (
          <>
            <IngredientsEditor value={ingredients} onChange={setIngr} />
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">조리시간</label>
                <DiscreteSlider marks={[10, 30, 60]} value={cookingTime ?? 30} onChange={setCookingTime} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">재료 링크 (선택) </h3>
                {showStage2Errors && stage2Errors.find((e) => e.field === 'linkUrl') && (
                  <span className="text-xs text-red-600 dark:text-red-400">{stage2Errors.find((e) => e.field === 'linkUrl')!.message}</span>
                )}
              </div>
              <div className="space-y-2">
                <input
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="재료 구매하러 가기"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md text-sm"
                />
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md text-sm"
                />
              </div>
            </div>
          </>
        )}

        {stage === 3 && (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">조리 순서</h3>
              {showStage3Errors && stage3Errors.find((e) => e.field === 'steps') && (
                <span className="text-xs text-red-600 dark:text-red-400">{stage3Errors.find((e) => e.field === 'steps')!.message}</span>
              )}
            </div>
            <StepsEditor
              initial={steps}
              maxBytes={10 * 1024 * 1024}
              onOversize={mode === 'edit' ? async (file) => {
                const { resizeImageToMaxBytes } = await import('@/lib/image/resize');
                return await resizeImageToMaxBytes(file, 10 * 1024 * 1024, { mimeType: 'image/webp' });
              } : undefined}
              onChange={(next) =>
                setSteps(
                  next.map((s) => ({
                    order: s.order,
                    description: s.description,
                    imagePath: s.imagePath,
                    imageFile: s.imageFile ?? undefined,
                  }))
                )
              }
            />
          </>
        )}
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={busy}
            className="px-6 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {stage === 1 ? '취소' : '이전'}
          </button>
          {stage < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={busy}
              className="flex-1 px-6 py-2.5 bg-black text-white rounded-md hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              다음
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={allErrors.length > 0 || busy}
              className="flex-1 px-6 py-2.5 bg-black text-white rounded-md hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {busy ? '처리 중...' : mode === 'create' ? '레시피 업로드' : '수정 저장'}
            </button>
          )}
        </div>
      </div>

      {busy && !embedded && (
        <div className="absolute inset-0 bg-white/60 dark:bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-200">
            <svg className="animate-spin h-5 w-5 text-black dark:text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span>{busyLabel}</span>
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) return card;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-form-title"
    >
      {card}
    </div>
  );
}


