'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

export default function ImageUploader({
  value,
  file,
  onFileChange,
  onCropChange,
  label = '대표 이미지',
}: {
  value?: string;
  file?: File | null;
  onFileChange: (file: File | undefined) => void;
  onCropChange?: (cropPercent: { x: number; y: number; width: number; height: number } | undefined) => void;
  label?: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // No separate preview URL; we use a stable sourceUrl for cropping
  const [cropPos, setCropPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | undefined>(undefined);
  const [sourceUrl, setSourceUrl] = useState<string | undefined>(undefined);
  const [userCleared, setUserCleared] = useState(false);
  const [autoCropped, setAutoCropped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cropSize, setCropSize] = useState<{ width: number; height: number } | undefined>(undefined);
  const initialPercentEmittedRef = useRef(false);

  useEffect(() => {
    // If parent clears file, also clear crop state unless we already have a sourceUrl
    if (!file && !value && sourceUrl) {
      setCroppedAreaPixels(undefined);
      revokeSourceUrl();
      setSourceUrl(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, value, sourceUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setCropSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Initialize crop source from existing value if present and not set yet
  useEffect(() => {
    if (sourceUrl || userCleared) return;
    if (value) {
      const v = value.startsWith('http') || value.startsWith('blob:') || value.startsWith('data:')
        ? value
        : `/media/${value}`;
      setSourceUrl(v);
    }
  }, [value, sourceUrl, userCleared]);

  // When crop surface is ready and we haven't produced a crop yet, trigger one programmatically
  useEffect(() => {
    if (sourceUrl && cropSize && !croppedAreaPixels && !autoCropped) {
      setAutoCropped(true);
      // Trigger a crop cycle without changing visual position
      setTimeout(() => setCropPos((p) => ({ ...p })), 0);
    }
  }, [sourceUrl, cropSize, croppedAreaPixels, autoCropped]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const nextFile = files[0];
    if (!ALLOWED_TYPES.has(nextFile.type)) {
      alert('지원하지 않는 이미지 형식입니다. jpg, jpeg, png, webp만 가능합니다.');
      return;
    }
    // Set crop source to the selected file's blob URL (keep this stable for quality)
    const url = URL.createObjectURL(nextFile);
    setSourceUrl(url);
    setCropPos({ x: 0, y: 0 });
    setCroppedAreaPixels(undefined);
    setAutoCropped(false);
    // Emit original file immediately; server will crop using percent from onCropComplete
    onFileChange(nextFile);
    if (onCropChange) onCropChange(undefined);
  }, [onFileChange, onCropChange]);

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

  const revokeSourceUrl = () => {
    if (sourceUrl && sourceUrl.startsWith('blob:')) {
      URL.revokeObjectURL(sourceUrl);
    }
  };

  const clearCrop = () => {
    setCroppedAreaPixels(undefined);
    revokeSourceUrl();
    setSourceUrl(undefined);
    setAutoCropped(false);
  };

  // Emit percent crop to parent whenever it completes
  const round2 = (n: number) => Math.max(0, Math.min(100, Math.round(n * 100) / 100));
  const handleCropComplete = (area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
    if (onCropChange) {
      const percent = { x: round2(area.x), y: round2(area.y), width: round2(area.width), height: round2(area.height) };
      onCropChange(percent);
    }
  };

  // Emit initial percent crop once media is loaded, even if the user doesn't drag
  const handleMediaLoaded = (media: { width: number; height: number; naturalWidth: number; naturalHeight: number }) => {
    if (!onCropChange || initialPercentEmittedRef.current || !cropSize) return;
    const displayedW = media.width; // after objectFit cover & zoom
    const displayedH = media.height;
    const cropW = cropSize.width;
    const cropH = cropSize.height;
    if (displayedW <= 0 || displayedH <= 0 || cropW <= 0 || cropH <= 0) return;
    const offsetX = Math.max(0, (displayedW - cropW) / 2);
    const offsetY = Math.max(0, (displayedH - cropH) / 2);
    const percent = {
      x: round2((offsetX / displayedW) * 100),
      y: round2((offsetY / displayedH) * 100),
      width: round2((cropW / displayedW) * 100),
      height: round2((cropH / displayedH) * 100),
    };
    onCropChange(percent);
    initialPercentEmittedRef.current = true;
  };

  const handleRemove = () => {
    if (sourceUrl) {
      clearCrop();
    }
    setUserCleared(true);
    onFileChange(undefined);
  };


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
      {/* Fixed 16:9 preview box to prevent layout shift and crop inside */}
      <div className="w-full aspect-[16/9] rounded-md bg-neutral-50 dark:bg-neutral-800 relative overflow-hidden mb-3">
        {sourceUrl ? (
          <div ref={containerRef} className="absolute inset-0">
            <Cropper
              image={sourceUrl}
              crop={cropPos}
              zoom={1}
              aspect={16 / 9}
              onCropChange={setCropPos}
              onCropComplete={handleCropComplete}
              objectFit="cover"
              cropSize={cropSize}
              onMediaLoaded={handleMediaLoaded}
            />
          </div>
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
        {(file || value || sourceUrl) && (
          <button
            type="button"
            onClick={handleRemove}
            className="px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            제거
          </button>
        )}
      </div>      
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

    </div>
  );
}


