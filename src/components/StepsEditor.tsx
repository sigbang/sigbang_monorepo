'use client';
import { useState } from 'react';
import { uploadFile } from '@/lib/api/media';

type Step = { order: number; description: string; imagePath?: string | null };

export default function StepsEditor({
  initial,
  onChange,
}: {
  initial?: Step[];
  onChange: (steps: Step[]) => void;
}) {
  const [steps, setSteps] = useState<Step[]>(initial ?? [{ order: 1, description: '' }]);

  const sync = (next: Step[]) => {
    setSteps(next);
    onChange(next);
  };

  const add = () => sync([...steps, { order: steps.length + 1, description: '' }]);
  const remove = (idx: number) => sync(steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })));
  const updateDesc = (idx: number, v: string) => sync(steps.map((s, i) => (i === idx ? { ...s, description: v } : s)));
  const setImg = async (idx: number, file: File) => {
    const path = await uploadFile(file);
    sync(steps.map((s, i) => (i === idx ? { ...s, imagePath: path } : s)));
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Step {s.order}</div>
          <textarea
            value={s.description}
            onChange={(e) => updateDesc(i, e.target.value)}
            rows={3}
            style={{ width: '100%' }}
            placeholder="조리 과정을 입력하세요"
          />
          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            {s.imagePath && <img src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/${s.imagePath}`} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6 }} />}
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setImg(i, e.target.files[0])} />
            <button type="button" onClick={() => sync(steps.map((t, idx) => (idx === i ? { ...t, imagePath: undefined } : t)))}>이미지 제거</button>
            <button type="button" onClick={() => remove(i)}>단계 삭제</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add}>단계 추가</button>
    </div>
  );
}


