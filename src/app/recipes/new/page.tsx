'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHotkeys } from '@/hooks/useHotkeys';
import ImageUploader from '@/components/ImageUploader';
import StepsEditor from '@/components/StepsEditor';
import RecipeBasics from '@/components/RecipeBasics';
import IngredientsEditor from '@/components/IngredientsEditor';
import TagsInput from '@/components/TagsInput';
import { aiGenerate, createRecipe, CreateRecipeDto } from '@/lib/api/recipes';

type Tag = { name: string; emoji?: string };

const DRAFT_KEY = 'recipe:new:draft';

export default function NewRecipePage() {
  const router = useRouter();
  const [stage, setStage] = useState(1); // 1: 기본정보, 2: 재료/시간, 3: 조리순서
  const [title, setTitle] = useState('');
  const [description, setDesc] = useState('');
  const [ingredients, setIngr] = useState('');
  const [thumbnailPath, setThumb] = useState<string | undefined>(undefined);
  const [thumbnailFile, setThumbFile] = useState<File | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [servings, setServings] = useState<number | undefined>(2);
  const [cookingTime, setCookingTime] = useState<number | undefined>(30);
  const [steps, setSteps] = useState<{ order: number; description: string; imagePath?: string | null }[]>([
    { order: 1, description: '' },
  ]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [busy, setBusy] = useState(false);

  // 로컬 draft 불러오기
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.title) setTitle(draft.title);
        if (draft.description) setDesc(draft.description);
        if (draft.ingredients) setIngr(draft.ingredients);
        if (draft.thumbnailPath) setThumb(draft.thumbnailPath);
        if (draft.difficulty) setDifficulty(draft.difficulty);
        if (draft.servings) setServings(draft.servings);
        if (draft.cookingTime) setCookingTime(draft.cookingTime);
        if (draft.steps) setSteps(draft.steps);
        if (draft.tags) setTags(draft.tags);
        if (draft.linkTitle) setLinkTitle(draft.linkTitle);
        if (draft.linkUrl) setLinkUrl(draft.linkUrl);
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  // 자동저장 (1.5초 디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      const draft = {
        title,
        description,
        ingredients,
        thumbnailPath,
        difficulty,
        servings,
        cookingTime,
        steps,
        tags,
        linkTitle,
        linkUrl,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 1500);
    return () => clearTimeout(timer);
  }, [title, description, ingredients, thumbnailPath, difficulty, servings, cookingTime, steps, tags, linkTitle, linkUrl]);

  // 단계별 검증
  const stage1Errors = [];
  if (!title || title.trim().length < 3) stage1Errors.push({ field: 'title', message: '제목 3자 이상 필요' });
  if (!thumbnailPath) stage1Errors.push({ field: 'thumbnail', message: '대표 이미지 필요' });

  const stage2Errors = [];
  if (linkUrl && !/^https?:\/\/.+/.test(linkUrl))
    stage2Errors.push({ field: 'linkUrl', message: '링크 URL 형식 오류' });

  const stage3Errors = [];
  if (steps.length === 0 || !steps[0].description.trim())
    stage3Errors.push({ field: 'steps', message: '첫 단계 설명 필요' });

  const allErrors = [...stage1Errors, ...stage2Errors, ...stage3Errors];

  const canProceed = (fromStage: number) => {
    if (fromStage === 1) return stage1Errors.length === 0;
    if (fromStage === 2) return stage2Errors.length === 0;
    if (fromStage === 3) return stage3Errors.length === 0;
    return true;
  };

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
    else router.back();
  };

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
        for (const s of steps as any[]) {
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
      localStorage.removeItem(DRAFT_KEY);
      alert(`레시피 업로드 완료: ${id}`);
      router.push('/');
    } catch (e: any) {
      alert(`업로드 실패: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };

  const saveDraft = () => {
    const draft = {
      title,
      description,
      ingredients,
      thumbnailPath,
      difficulty,
      servings,
      cookingTime,
      steps,
      tags,
      linkTitle,
      linkUrl,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    alert('임시 저장되었습니다.');
  };

  const generateAI = async () => {
    if (!thumbnailPath) return alert('대표 이미지를 먼저 등록해주세요');
    setBusy(true);
    try {
      const res = await aiGenerate({ imagePath: thumbnailPath, title: title || undefined });
      // 서버 응답 형식에 맞춰 필드 병합
      if (res.title && !title) setTitle(res.title);
      if (res.description) setDesc(res.description);
      if (res.ingredients) setIngr(res.ingredients);
      if (res.cookingTime) setCookingTime(res.cookingTime);
      if (res.steps && res.steps.length > 0) setSteps(res.steps);
      alert('AI 생성 완료! 내용을 확인하세요.');
    } catch (e: any) {
      alert(`AI 생성 실패: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };

  // 키보드 단축키
  useHotkeys({
    'Ctrl+s': (e) => {
      e.preventDefault();
      saveDraft();
    },
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
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* 헤더 */}
          <div className="border-b border-neutral-200 dark:border-neutral-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 id="recipe-wizard-title" className="text-2xl font-semibold">
                레시피 등록
              </h1>
              <button
                type="button"
                onClick={handlePrev}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                aria-label="닫기"
              >
                ✕
          </button>
        </div>

            {/* 단계 표시 */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      s === stage
                        ? 'bg-blue-600 text-white'
                        : s < stage
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}
                  >
                    {s < stage ? '✓' : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded transition-colors ${
                        s < stage
                          ? 'bg-blue-600'
                          : 'bg-neutral-200 dark:bg-neutral-800'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {stage === 1 && '기본 정보'}
              {stage === 2 && '재료 & 조리 시간'}
              {stage === 3 && '조리 순서'}
            </div>
          </div>

          {/* 본문 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Stage 1: 기본 정보 */}
            {stage === 1 && (
              <>
                <ImageUploader value={thumbnailPath} file={thumbnailFile} onFileChange={setThumbFile} />
                {(thumbnailFile || thumbnailPath) && (
                  <button
                    type="button"
                    onClick={generateAI}
                    disabled={busy}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🪄 AI로 레시피 생성
                  </button>
                )}
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
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-blue-500"
                    maxLength={60}
                  />
                  <div className="text-xs text-neutral-500 mt-1">{title.length}/60자</div>
                </div>
                <div>
                  <label htmlFor="recipe-description" className="block text-sm font-medium mb-1">
                    설명
                  </label>
                  <textarea
                    id="recipe-description"
                    value={description}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={5}
                    placeholder="레시피에 대한 간단한 설명을 입력하세요"
                    maxLength={500}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="text-xs text-neutral-500 mt-1">{description.length}/500자</div>
                </div>
              </>
            )}

            {/* Stage 2: 재료 & 조리 시간 */}
            {stage === 2 && (
              <>
                <IngredientsEditor value={ingredients} onChange={setIngr} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="servings" className="block text-sm font-medium mb-1">
                      인분
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setServings(Math.max(1, (servings ?? 1) - 1))}
                        className="px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        −
                      </button>
                      <input
                        id="servings"
                        type="number"
                        min={1}
                        max={99}
                        value={servings ?? ''}
                        onChange={(e) => setServings(e.target.value ? +e.target.value : undefined)}
                        className="w-20 text-center px-2 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setServings((servings ?? 1) + 1)}
                        className="px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        +
                      </button>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">인분</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cooking-time" className="block text-sm font-medium mb-1">
                      조리시간
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="cooking-time"
                        type="range"
                        min={0}
                        max={180}
                        step={5}
                        value={cookingTime ?? 0}
                        onChange={(e) => setCookingTime(+e.target.value || undefined)}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min={0}
                        max={180}
                        value={cookingTime ?? ''}
                        onChange={(e) => setCookingTime(e.target.value ? +e.target.value : undefined)}
                        className="w-16 text-right px-2 py-1 border border-neutral-300 dark:border-neutral-700 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">분</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">난이도</label>
                  <div className="inline-flex rounded-md bg-neutral-100 dark:bg-neutral-900 p-1">
                    {(['easy', 'medium', 'hard'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`px-4 py-1.5 rounded text-sm transition-all ${
                          difficulty === d
                            ? 'bg-white dark:bg-neutral-800 shadow'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        onClick={() => setDifficulty(d)}
                      >
                        {d === 'easy' ? '쉬움' : d === 'medium' ? '보통' : '어려움'}
                      </button>
                    ))}
                  </div>
                </div>

                <TagsInput tags={tags} onChange={setTags} />

                <div>
                  <h3 className="text-sm font-medium mb-3">외부 링크 (선택)</h3>
                  <div className="space-y-2">
                    <input
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="링크 제목"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
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
          <div className="border-t border-neutral-200 dark:border-neutral-800 p-6">
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
                  className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  다음
                </button>
              ) : (
                <button
                  type="button"
                  onClick={publish}
                  disabled={allErrors.length > 0 || busy}
                  className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {busy ? '업로드 중...' : '레시피 업로드'}
                </button>
              )}
            </div>
            <div className="text-xs text-neutral-500 text-center mt-3">
              <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700">
                Ctrl+Enter
              </kbd>{' '}
              {stage === 3 ? '발행' : '다음'} ·{' '}
              <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700">
                Esc
              </kbd>{' '}
              {stage === 1 ? '취소' : '이전'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


