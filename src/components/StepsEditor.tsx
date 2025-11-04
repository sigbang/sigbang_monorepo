'use client';
import { useState } from 'react';

type Step = { order: number; description: string; imagePath?: string | null; imageFile?: File | null };

export default function StepsEditor({
  initial,
  onChange,
}: {
  initial?: Step[];
  onChange: (steps: Step[]) => void;
}) {
  const [steps, setSteps] = useState<Step[]>(initial ?? [{ order: 1, description: '' }]);
  const [uploading, setUploading] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

  const sync = (next: Step[]) => {
    setSteps(next);
    onChange(next);
  };

  const add = () => sync([...steps, { order: steps.length + 1, description: '' }]);
  const remove = (idx: number) => sync(steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })));
  const updateDesc = (idx: number, v: string) => sync(steps.map((s, i) => (i === idx ? { ...s, description: v } : s)));
  
  const setImg = async (idx: number, file: File) => {
    // Blob URL 미리보기만, 업로드는 제출 시
    setUploading(idx);
    try {
      sync(steps.map((s, i) => (i === idx ? { ...s, imageFile: file } : s)));
    } finally {
      setUploading(null);
    }
  };

  const handlePaste = async (idx: number, e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (ALLOWED_TYPES.has(items[i].type)) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          await setImg(idx, file);
          break;
        }
      }
    }
  };

  const handleDrop = async (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) {
      alert('지원하지 않는 이미지 형식입니다. jpg, jpeg, png, webp만 가능합니다.');
      return;
    }
    await setImg(idx, file);
  };

  const moveStep = (from: number, to: number) => {
    if (to < 0 || to >= steps.length) return;
    const reordered = [...steps];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    sync(reordered.map((s, i) => ({ ...s, order: i + 1 })));
  };

  return (
    <div className="space-y-3">      
      {steps.map((s, i) => (
        <div
          key={i}
          className={`p-4 border rounded-lg transition-colors ${
            dragOver === i
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-neutral-200 dark:border-neutral-800'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(i);
          }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => handleDrop(i, e)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-sm">Step {s.order}</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => moveStep(i, i - 1)}
                disabled={i === 0}
                className="px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
                aria-label="위로 이동"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveStep(i, i + 1)}
                disabled={i === steps.length - 1}
                className="px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
                aria-label="아래로 이동"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 dark:hover:bg-red-950"
              >
                삭제
              </button>
            </div>
          </div>
          <textarea
            value={s.description}
            onChange={(e) => updateDesc(i, e.target.value)}
            onPaste={(e) => handlePaste(i, e)}
            rows={3}
            placeholder="조리 과정 입력"
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md resize-none"
          />
          <div className="mt-3 flex gap-3 items-center">
            {(s.imageFile || s.imagePath) && (
              <div className="relative">
                <img
                  src={s.imageFile ? URL.createObjectURL(s.imageFile) : (s.imagePath?.startsWith('http') ? s.imagePath : `/media/${s.imagePath}`)}
                  alt=""
                  className="w-24 h-24 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => sync(steps.map((t, idx) => (idx === i ? { ...t, imagePath: undefined, imageFile: undefined } : t)))}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => e.target.files?.[0] && setImg(i, e.target.files[0])}
                className="hidden"
              />
              <span className="inline-block px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800">
                {uploading === i ? '처리 중...' : s.imageFile || s.imagePath ? '이미지 변경' : '이미지 추가'}
              </span>
            </label>
            <span className="text-xs text-neutral-500">드래그 앤 드롭 가능</span>
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={add}
          className="px-4 py-2 text-sm bg-amber-400 text-black rounded-md hover:bg-amber-500"
        >
          + 단계 추가
        </button>
      </div>
    </div>
  );
}


