'use client';
import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import StepsEditor from '@/components/StepsEditor';
import { aiGenerate, createRecipe, CreateRecipeDto } from '@/lib/api/recipes';

export default function NewRecipePage() {
  const [title, setTitle] = useState('');
  const [description, setDesc] = useState('');
  const [ingredients, setIngr] = useState('');
  const [thumbnailPath, setThumb] = useState<string | undefined>(undefined);
  const [steps, setSteps] = useState<{ order: number; description: string; imagePath?: string | null }[]>([]);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const publish = async () => {
    setBusy(true);
    try {
      const dto: CreateRecipeDto = {
        title,
        description,
        ingredients,
        thumbnailPath,
        steps,
        ...(linkTitle ? { linkTitle } : {}),
        ...(linkUrl ? { linkUrl } : {}),
      };
      const id = await createRecipe(dto);
      alert(`레시피 업로드 완료: ${id}`);
      window.location.href = '/';
    } catch (e: any) {
      alert(`업로드 실패: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };

  const generateAI = async () => {
    if (!thumbnailPath) return alert('대표 이미지를 먼저 등록해주세요');
    setBusy(true);
    try {
      await aiGenerate({ imagePath: thumbnailPath, title: title || undefined });
      alert('AI 생성 요청 완료 (응답 처리 로직은 서버 스펙에 맞춰 추가하세요)');
    } catch (e: any) {
      alert(`AI 생성 실패: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{ padding: 24, display: 'grid', gap: 24 }}>
      <h2>레시피 등록</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>
        <div>
          <ImageUploader value={thumbnailPath} onChange={setThumb} />
          <button type="button" onClick={generateAI} disabled={!thumbnailPath || busy} style={{ marginTop: 12 }}>
            AI로 레시피 생성
          </button>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" />
          <textarea value={description} onChange={(e) => setDesc(e.target.value)} rows={4} placeholder="설명" />
          <textarea value={ingredients} onChange={(e) => setIngr(e.target.value)} rows={3} placeholder="재료" />
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} placeholder="링크 제목(선택)" />
            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="링크 URL(선택)" />
          </div>
          <StepsEditor initial={[]} onChange={setSteps} />
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={() => history.back()} disabled={busy}>이전</button>
            <button type="button" onClick={publish} disabled={busy}>{busy ? '업로드 중...' : '레시피 업로드'}</button>
          </div>
        </div>
      </div>
    </main>
  );
}


