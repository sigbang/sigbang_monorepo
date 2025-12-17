'use client';

import { useState } from 'react';
import { aiNormalizeIngredients } from '@/lib/api/recipes';

type IngredientsEditorProps = {
  value: string;
  onChange: (v: string) => void;
};

export default function IngredientsEditor({ value, onChange }: IngredientsEditorProps) {
  const [loading, setLoading] = useState(false);

  const lines = value.split('\n').filter((l) => l.trim());
  const lineCount = lines.length;

  const handleAiNormalize = async () => {
    if (!value.trim() || loading) return;
    setLoading(true);
    try {
      const normalized = await aiNormalizeIngredients({ raw: value, locale: 'ko' });
      const next = (normalized ?? '').trim();
      if (next && next !== value.trim()) {
        onChange(next);
      }
    } catch (e) {
      console.error(e);
      alert('AI로 재료를 보정하는 데 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor="ingredients" className="block text-sm font-medium">
          재료
        </label>
        <button
          type="button"
          onClick={handleAiNormalize}
          disabled={loading || !value.trim()}
          className="text-xs font-medium text-primary-600 disabled:text-neutral-400"
        >
          {loading ? 'AI로 재료 보정 중...' : 'AI로 재료 보정하기'}
        </button>
      </div>
      <textarea
        id="ingredients"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`예:
계란 2개
간장 1큰술
참기름 약간`}
        rows={8}
        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md font-mono text-sm"
      />
      <div className="mt-1 text-xs text-neutral-500">{lineCount}개 재료</div>
    </div>
  );
}


