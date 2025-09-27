'use client';
import { useCallback, useRef, useState } from 'react';
import { uploadFile } from '@/lib/api/media';

export default function ImageUploader({
  value,
  onChange,
  label = '대표 이미지',
}: {
  value?: string;
  onChange: (path: string | undefined) => void;
  label?: string;
}) {
  const [isUploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const path = await uploadFile(files[0]);
      onChange(path);
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  return (
    <div style={{ border: '1px dashed #ccc', padding: 16, borderRadius: 8 }}>
      <div style={{ marginBottom: 8 }}>{label}</div>
      {value ? (
        <div style={{ position: 'relative' }}>
          <img src={value.startsWith('http') ? value : `${process.env.NEXT_PUBLIC_API_BASE_URL}/${value}`} alt="thumbnail" style={{ width: 240, height: 240, objectFit: 'cover', borderRadius: 8 }} />
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => onChange(undefined)}>제거</button>
            <button type="button" onClick={() => inputRef.current?.click()}>변경</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}>
            {isUploading ? '업로드 중...' : '이미지 선택'}
          </button>
          <span>또는 파일을 드래그 앤 드롭</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}


