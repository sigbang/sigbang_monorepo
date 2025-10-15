'use client';

type IngredientsEditorProps = {
  value: string;
  onChange: (v: string) => void;
};

export default function IngredientsEditor({ value, onChange }: IngredientsEditorProps) {
  const lines = value.split('\n').filter((l) => l.trim());
  const lineCount = lines.length;

  return (
    <div>
      <label htmlFor="ingredients" className="block text-sm font-medium mb-1">
        재료
      </label>
      <textarea
        id="ingredients"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="한 줄에 하나씩 입력하세요&#10;예:&#10;- 계란 2개&#10;- 간장 1큰술&#10;- 참기름 약간"
        rows={8}
        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md font-mono text-sm"
      />
      <div className="text-xs text-neutral-500 mt-1">{lineCount}개 재료</div>
    </div>
  );
}

