'use client';
import { useState } from 'react';

type Tag = { name: string; emoji?: string };

type TagsInputProps = {
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
};

export default function TagsInput({ tags, onChange }: TagsInputProps) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (!trimmed || tags.length >= 10) return;
    if (tags.some((t) => t.name === trimmed)) return;
    onChange([...tags, { name: trimmed }]);
    setInput('');
  };

  const removeTag = (idx: number) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <label htmlFor="tags-input" className="block text-sm font-medium mb-1">
        태그 (최대 10개)
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
          >
            {tag.emoji && <span>{tag.emoji}</span>}
            <span>{tag.name}</span>
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="ml-1 hover:text-blue-600 dark:hover:text-blue-400"
              aria-label={`${tag.name} 태그 삭제`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          id="tags-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="태그 입력 후 Enter"
          maxLength={20}
          className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-blue-500"
          disabled={tags.length >= 10}
        />
        <button
          type="button"
          onClick={addTag}
          disabled={!input.trim() || tags.length >= 10}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          추가
        </button>
      </div>
      <div className="text-xs text-neutral-500 mt-1">{tags.length}/10 태그</div>
    </div>
  );
}

