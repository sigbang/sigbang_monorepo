'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export default function ImageUploader({
  value,
  file,
  onFileChange,
  label = '대표 이미지',
}: {
  value?: string;
  file?: File | null;
  onFileChange: (file: File | undefined) => void;
  label?: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!ALLOWED_TYPES.has(file.type)) {
      alert('지원하지 않는 이미지 형식입니다. jpg, jpeg, png, webp만 가능합니다.');
      return;
    }
    onFileChange(file);
  }, [onFileChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (ALLOWED_TYPES.has(items[i].type)) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          const dt = new DataTransfer(); dt.items.add(file);
          await handleFiles(dt.files);
          break;
        }
      }
    }
  }, [handleFiles]);

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
        dragOver
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
          : 'border-neutral-300 dark:border-neutral-700'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0}
    >
      <div className="text-sm font-medium mb-3">
        {label} <span className="text-red-500">*</span>
      </div>
      {/* Fixed 16:7 preview box to prevent layout shift and crop inside */}
      <div className="w-full aspect-[16/7] rounded-md bg-neutral-50 dark:bg-neutral-800 relative overflow-hidden mb-3">
        {file || value ? (
          <img
            src={
              file
                ? (previewUrl as string)
                : value && (value.startsWith('http') || value.startsWith('blob:') || value.startsWith('data:'))
                ? (value as string)
                : `/media/${value}`
            }
            alt="thumbnail"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm">
            이미지를 선택하거나 드래그 앤 드롭 / 붙여넣기
          </div>
        )}
      </div>

      {/* Actions keep the upload UI visible regardless of selection */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex-1 px-3 py-2 bg-amber-400 text-black text-sm border border-neutral-300 dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          이미지 선택
        </button>
        {(file || value) && (
          <button
            type="button"
            onClick={() => onFileChange(undefined)}
            className="px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            제거
          </button>
        )}
      </div>      
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}


