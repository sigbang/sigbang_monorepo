'use client';

type RecipeBasicsProps = {
  title: string;
  onTitleChange: (v: string) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
  onDifficultyChange: (v: 'easy' | 'medium' | 'hard') => void;
  servings?: number;
  onServingsChange: (v: number | undefined) => void;
  cookingTime?: number;
  onCookingTimeChange: (v: number | undefined) => void;
};

export default function RecipeBasics({
  title,
  onTitleChange,
  difficulty,
  onDifficultyChange,
  servings,
  onServingsChange,
  cookingTime,
  onCookingTimeChange,
}: RecipeBasicsProps) {
  return (
    <div className="space-y-4">
      {/* 제목 */}
      <div>
        <label htmlFor="recipe-title" className="block text-sm font-medium mb-1">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          id="recipe-title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="예: 간장 계란밥"
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={60}
        />
        <div className="text-xs text-neutral-500 mt-1">{title.length}/60자</div>
      </div>

      {/* 난이도 */}
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
              onClick={() => onDifficultyChange(d)}
            >
              {d === 'easy' ? '쉬움' : d === 'medium' ? '보통' : '어려움'}
            </button>
          ))}
        </div>
      </div>

      {/* 인분 & 조리시간 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="servings" className="block text-sm font-medium mb-1">
            인분
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onServingsChange(Math.max(1, (servings ?? 1) - 1))}
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
              onChange={(e) => onServingsChange(e.target.value ? +e.target.value : undefined)}
              className="w-20 text-center px-2 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => onServingsChange((servings ?? 1) + 1)}
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
              onChange={(e) => onCookingTimeChange(+e.target.value || undefined)}
              className="flex-1"
            />
            <input
              type="number"
              min={0}
              max={180}
              value={cookingTime ?? ''}
              onChange={(e) => onCookingTimeChange(e.target.value ? +e.target.value : undefined)}
              className="w-16 text-right px-2 py-1 border border-neutral-300 dark:border-neutral-700 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">분</span>
          </div>
        </div>
      </div>
    </div>
  );
}

