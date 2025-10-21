'use client';

import { useEffect, useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import StepsEditor from '@/components/StepsEditor';
import IngredientsEditor from '@/components/IngredientsEditor';
import DiscreteSlider from '@/components/DiscreteSlider';
import { CreateRecipeDto, RecipeDetail } from '@/lib/api/recipes';
import { useHotkeys } from '@/hooks/useHotkeys';

type StepDraft = { order: number; description: string; imagePath?: string | null; imageFile?: File };

type Props = {
  mode: 'create' | 'edit';
  initial?: RecipeDetail;
  onSubmit: (dto: CreateRecipeDto) => Promise<void>;
  onCancel: () => void;
  embedded?: boolean;
};

export default function RecipeForm({ mode, initial, onSubmit, onCancel, embedded = false }: Props) {
  const [stage, setStage] = useState(1);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDesc] = useState(initial?.description ?? '');
  const [ingredients, setIngr] = useState(initial?.ingredients ?? '');
  
  // Use the same image resolution logic as the detail page
  const getThumbnailPath = (recipe?: RecipeDetail) => {
    if (!recipe) return undefined;
    const thumb = recipe.thumbnailImage || recipe.thumbnailUrl || recipe.thumbnailPath;
    if (!thumb) return undefined;
    // If it's already a full URL, return as-is
    if (/^https?:/i.test(thumb)) return thumb;
    // If it's already a media path, return as-is
    if (thumb.startsWith('/media/')) return thumb;
    // Otherwise, prepend /media/
    const clean = thumb.startsWith('/') ? thumb.slice(1) : thumb;
    return `/media/${clean}`;
  };
  
  const [thumbnailPath, setThumbPath] = useState<string | undefined>(getThumbnailPath(initial));
  const [thumbnailFile, setThumbFile] = useState<File | undefined>(undefined);
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

  useEffect(() => {
    // When switching to stage 3, ensure at least 3 steps exist for better UX
    if (stage === 3 && steps.length < 3) {
      setSteps((prev) => {
        const toAdd = Array.from({ length: 3 - prev.length }, (_v, i) => ({ order: prev.length + i + 1, description: '' }));
        return [...prev, ...toAdd];
      });
    }
  }, [stage, steps.length]);

  const stage1Errors: { field: string; message: string }[] = [];
  if (!title || title.trim().length < 3) stage1Errors.push({ field: 'title', message: '제목 3자 이상 필요' });
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

  const getErrorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

  const handleNext = () => {
    if (!canProceed(stage)) {
      const errors = stage === 1 ? stage1Errors : stage === 2 ? stage2Errors : stage3Errors;
      alert(`필수 항목을 완료해주세요:\n${errors.map((e) => `- ${e.message}`).join('\n')}`);
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
      alert(`필수 항목을 완료해주세요:\n${allErrors.map((e) => `- ${e.message}`).join('\n')}`);
      return;
    }
    setBusy(true);
    try {
      // Thumbnail upload only when a new file is selected
      let finalThumbnailPath = thumbnailPath;
      if (thumbnailFile) {
        const { uploadFile } = await import('@/lib/api/media');
        finalThumbnailPath = await uploadFile(thumbnailFile);
        setThumbPath(finalThumbnailPath);
      }

      // Step images: keep existing imagePath, only upload new imageFile
      const stepsWithUploaded: { order: number; description: string; imagePath?: string | null }[] = [];
      if (steps && steps.length) {
        const { uploadFile } = await import('@/lib/api/media');
        for (const s of steps) {
          let imagePath = s.imagePath ?? undefined;
          if (s.imageFile) imagePath = await uploadFile(s.imageFile as File);
          stepsWithUploaded.push({ order: s.order, description: s.description, imagePath: imagePath ?? undefined });
        }
      }

      const dto: CreateRecipeDto = {
        title: title.trim(),
        description: description.trim(),
        ingredients: ingredients.trim(),
        thumbnailPath: finalThumbnailPath,
        cookingTime,
        steps: stepsWithUploaded.filter((s) => s.description.trim()),
        ...(linkTitle ? { linkTitle } : {}),
        ...(linkUrl ? { linkUrl } : {}),
      };
      await onSubmit(dto);
    } catch (e: unknown) {
      alert(`처리 실패: ${getErrorMessage(e)}`);
    } finally {
      setBusy(false);
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
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-[820px] max-h-[90vh] overflow-hidden flex flex-col">
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
            <ImageUploader value={thumbnailPath} file={thumbnailFile} onFileChange={setThumbFile} />
            <div>
              <label htmlFor="recipe-title" className="block text-sm font-medium mb-1">
                제목 <span className="text-red-500">*</span>
              </label>
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
              <h3 className="text-sm font-medium mb-3">재료 링크 (선택) </h3>
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
            <StepsEditor initial={steps} onChange={setSteps} />
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
              disabled={!canProceed(stage)}
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


