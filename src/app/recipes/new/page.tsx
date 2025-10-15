'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHotkeys } from '@/hooks/useHotkeys';
import ImageUploader from '@/components/ImageUploader';
import StepsEditor from '@/components/StepsEditor';
import IngredientsEditor from '@/components/IngredientsEditor';
import DiscreteSlider from '@/components/DiscreteSlider';
import { createRecipe, CreateRecipeDto } from '@/lib/api/recipes';

type Tag = { name: string; emoji?: string };

type ValidationError = { field: string; message: string };
type StepDraft = { order: number; description: string; imagePath?: string | null; imageFile?: File };

export default function NewRecipePage() {
  const router = useRouter();
  const [stage, setStage] = useState(1); // 1: 기본정보, 2: 재료/시간, 3: 조리순서
  const [title, setTitle] = useState('');
  const [description, setDesc] = useState('');
  const [ingredients, setIngr] = useState('');
  const [thumbnailPath] = useState<string | undefined>(undefined);
  const [thumbnailFile, setThumbFile] = useState<File | undefined>(undefined);
  const difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  const servings: number | undefined = 2;
  const [cookingTime, setCookingTime] = useState<number | undefined>(30);
  const [steps, setSteps] = useState<{ order: number; description: string; imagePath?: string | null }[]>([
    { order: 1, description: '' },
    { order: 2, description: '' },
    { order: 3, description: '' },
  ]);
  const tags: Tag[] = [];
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [busy, setBusy] = useState(false);

  // 로컬 draft 기능 제거됨

  // 과거에 저장된 임시 레시피 제거 (잔여 데이터 청소)
  useEffect(() => {
    try {
      localStorage.removeItem('recipe:new:draft');
    } catch {}
  }, []);

  // 단계별 검증
  const stage1Errors: ValidationError[] = [];
  if (!title || title.trim().length < 3) stage1Errors.push({ field: 'title', message: '제목 3자 이상 필요' });
  if (!thumbnailPath && !thumbnailFile) stage1Errors.push({ field: 'thumbnail', message: '대표 이미지 필요' });

  const stage2Errors: ValidationError[] = [];
  if (linkUrl && !/^https?:\/\/.+/.test(linkUrl))
    stage2Errors.push({ field: 'linkUrl', message: '링크 URL 형식 오류' });

  const stage3Errors: ValidationError[] = [];
  if (steps.length === 0 || !steps[0].description.trim())
    stage3Errors.push({ field: 'steps', message: '첫 단계 설명 필요' });

  const allErrors = [...stage1Errors, ...stage2Errors, ...stage3Errors];

  const canProceed = (fromStage: number) => {
    if (fromStage === 1) return stage1Errors.length === 0;
    if (fromStage === 2) return stage2Errors.length === 0;
    if (fromStage === 3) return stage3Errors.length === 0;
    return true;
  };

  const ensureMinSteps = (min: number) => {
    setSteps((prev) => {
      if (!prev || prev.length >= min) return prev;
      const toAdd = Array.from({ length: min - prev.length }, (_v, i) => ({
        order: prev.length + i + 1,
        description: '',
      }));
      return [...prev, ...toAdd];
    });
  };

  const handleNext = () => {
    if (!canProceed(stage)) {
      const errors = stage === 1 ? stage1Errors : stage === 2 ? stage2Errors : stage3Errors;
      alert(`필수 항목을 완료해주세요:\n${errors.map((e) => `- ${e.message}`).join('\n')}`);
      return;
    }
    if (stage < 3) {
      const nextStage = stage + 1;
      if (nextStage === 3) ensureMinSteps(3);
      setStage(nextStage);
    }
  };

  const handlePrev = () => {
    if (stage > 1) setStage(stage - 1);
    else router.back();
  };

  const handleClose = () => {
    const ok = window.confirm('작성 중인 내용이 저장되지 않고 닫힙니다. 계속하시겠습니까?');
    if (ok) router.back();
  };

  const getErrorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

  const publish = async () => {
    if (allErrors.length > 0) {
      alert(`필수 항목을 완료해주세요:\n${allErrors.map((e) => `- ${e.message}`).join('\n')}`);
      return;
    }
    setBusy(true);
    try {
      // 제출 시 업로드 수행 (썸네일)
      let finalThumbnailPath = thumbnailPath;
      if (thumbnailFile) {
        const { uploadFile } = await import('@/lib/api/media');
        finalThumbnailPath = await uploadFile(thumbnailFile);
      }

      // 단계 이미지 업로드 처리
      const stepsWithUploaded: { order: number; description: string; imagePath?: string | null }[] = [];
      if (steps && steps.length) {
        const { uploadFile } = await import('@/lib/api/media');
        for (const s of steps as StepDraft[]) {
          let imagePath = s.imagePath ?? undefined;
          if (s.imageFile) {
            imagePath = await uploadFile(s.imageFile as File);
          }
          stepsWithUploaded.push({ order: s.order, description: s.description, imagePath: imagePath ?? undefined });
        }
      }

      const dto: CreateRecipeDto = {
        title: title.trim(),
        description: description.trim(),
        ingredients: ingredients.trim(),
        thumbnailPath: finalThumbnailPath,
        difficulty,
        servings,
        cookingTime,
        steps: stepsWithUploaded.filter((s) => s.description.trim()),
        tags,
        ...(linkTitle ? { linkTitle } : {}),
        ...(linkUrl ? { linkUrl } : {}),
      };
      const id = await createRecipe(dto);
      alert(`레시피 업로드 완료: ${id}`);
      router.push('/');
    } catch (e: unknown) {
      alert(`업로드 실패: ${getErrorMessage(e)}`);
    } finally {
      setBusy(false);
    }
  };

  // 임시 저장 기능 제거됨

  // AI 생성 기능 제거됨

  // 키보드 단축키
  useHotkeys({
    'Ctrl+Enter': (e) => {
      e.preventDefault();
      if (stage === 3) publish();
      else handleNext();
    },
    'Escape': (e) => {
      e.preventDefault();
      handlePrev();
    },
  });

  return (
    <>
      {/* 모달 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-wizard-title"
      >
        {/* 모달 카드 */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-[28vw] max-h-[90vh] overflow-hidden flex flex-col">
          {/* 헤더 */}
          <div className="border-b border-neutral-200 dark:border-neutral-800 p-2">
            <div className="relative mb-2">
              <h1 id="recipe-wizard-title" className="text-xl font-semibold text-center">
                레시피 등록
              </h1>
              <button
                type="button"
                onClick={handleClose}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 본문: 스크롤 가능 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Stage 1: 기본 정보 */}
            {stage === 1 && (
              <>
                <ImageUploader value={thumbnailPath} file={thumbnailFile} onFileChange={setThumbFile} />
                {/* AI 생성 버튼 제거 */}
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
                    rows={3}
                    placeholder="레시피에 대한 간단한 설명을 입력하세요"
                    maxLength={500}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md resize-none"
                  />
                  
                </div>
              </>
            )}

            {/* Stage 2: 재료 & 조리 시간 */}
            {stage === 2 && (
              <>
                <IngredientsEditor value={ingredients} onChange={setIngr} />
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">조리시간</label>
                    <DiscreteSlider marks={[10, 30, 60]} value={cookingTime ?? 30} onChange={setCookingTime} />
                  </div>
                </div>

                {/* 난이도, 태그 입력 제거 */}

                <div>
                  <h3 className="text-sm font-medium mb-3">외부 링크 (선택)</h3>
                  <div className="space-y-2">
                    <input
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="링크 제목"
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

            {/* Stage 3: 조리 순서 */}
            {stage === 3 && (
              <>
                <StepsEditor initial={steps} onChange={setSteps} />
              </>
            )}
          </div>

          {/* 푸터 */}
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
                  onClick={publish}
                  disabled={allErrors.length > 0 || busy}
                  className="flex-1 px-6 py-2.5 bg-black text-white rounded-md hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {busy ? '업로드 중...' : '레시피 업로드'}
                </button>
              )}
            </div>            
          </div>
        </div>
      </div>
    </>
  );
}


