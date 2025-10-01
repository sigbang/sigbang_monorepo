'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

  const previewUrl = useMemo(() => {
    return file ? URL.createObjectURL(file) : undefined;
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onFileChange(files[0]);
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
      if (items[i].type.startsWith('image/')) {
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
      {file || value ? (
        <div className="space-y-3">
          <img
            src={file ? (previewUrl as string) : value?.startsWith('http') ? (value as string) : `/media/${value}`}
            alt="thumbnail"
            className="w-full aspect-square object-cover rounded-md"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onFileChange(undefined)}
              className="flex-1 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              제거
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex-1 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              변경
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-neutral-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
          >
            이미지 선택
          </button>
          <p className="text-xs text-neutral-500">
            또는 파일을 드래그 앤 드롭 / 붙여넣기
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}


