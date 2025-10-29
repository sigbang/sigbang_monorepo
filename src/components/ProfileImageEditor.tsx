"use client";

import Image from 'next/image';
import { useMemo, useRef, useState } from 'react';
import { useProfileImageDefaults, useSetDefaultProfileImage, useSetRandomProfileImage, useUploadProfileImage } from '@/lib/hooks/users';

type Props = {
  onDone?: () => void;
};

export default function ProfileImageEditor({ onDone }: Props) {
  const [tab, setTab] = useState<'presets' | 'upload'>('presets');
  const { data: presets, isLoading: presetsLoading } = useProfileImageDefaults(true);
  const randomMut = useSetRandomProfileImage();
  const setDefaultMut = useSetDefaultProfileImage();
  const uploadMut = useUploadProfileImage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const busy = randomMut.isPending || setDefaultMut.isPending || uploadMut.isPending;

  const onPickDefault = async (key: string) => {
    if (busy) return;
    try { await setDefaultMut.mutateAsync(key); } finally { onDone?.(); }
  };

  const onRandom = async () => {
    if (busy) return;
    try { await randomMut.mutateAsync(); } finally { onDone?.(); }
  };

  const onSelectFile = (f?: File | null) => {
    setFile(f ?? null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const onUpload = async () => {
    if (!file || busy) return;
    try { await uploadMut.mutateAsync(file); } finally { onDone?.(); }
  };

  return (
    <div className="w-full max-w-[720px] mx-auto rounded-xl border border-[#eee] p-4">
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          className={(tab === 'presets' ? 'bg-black text-white ' : 'bg-amber-400 text-black ') + 'px-3 py-1 rounded-md text-sm'}
          onClick={() => setTab('presets')}
        >
          기본 제공 이미지
        </button>
        <button
          type="button"
          className={(tab === 'upload' ? 'bg-black text-white ' : 'bg-amber-400 text-black ') + 'px-3 py-1 rounded-md text-sm'}
          onClick={() => setTab('upload')}
        >
          직접 업로드
        </button>
        {tab === 'presets' && (
          <button
            type="button"
            onClick={onRandom}
            disabled={busy}
            className="ml-auto px-3 py-1 rounded-md text-sm border border-black"
          >
            랜덤 적용
          </button>
        )}
      </div>

      {tab === 'presets' ? (
        <div>
          {presetsLoading && <div className="py-6 text-center text-sm">불러오는 중...</div>}
          {!presetsLoading && (!presets || presets.length === 0) && (
            <div className="py-6 text-center text-sm text-neutral-500">기본 이미지가 없습니다</div>
          )}
          <div className="grid grid-cols-5 gap-3">
            {(presets ?? []).map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => onPickDefault(p.key)}
                disabled={busy}
                className="aspect-square rounded-full overflow-hidden border border-[#ddd] bg-[#f6f6f6] relative focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                title={p.key}
              >
                {p.url ? (
                  <Image src={p.url} alt={p.key} fill sizes="120px" style={{ objectFit: 'cover' }} />
                ) : (
                  <span className="absolute inset-0 bg-neutral-200" />
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-start gap-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border border-[#ddd] bg-[#f6f6f6] relative">
              {previewUrl ? (
                <Image src={previewUrl} alt="미리보기" fill sizes="128px" style={{ objectFit: 'cover' }} />
              ) : (
                <span className="absolute inset-0 bg-neutral-200" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm text-neutral-600 mb-2">JPG, PNG, WEBP 권장. 정사각형 이미지를 권장합니다.</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="px-3 py-2 bg-amber-400 text-black text-sm border border-neutral-300 rounded-md hover:bg-neutral-100"
                >
                  파일 선택
                </button>
                <button
                  type="button"
                  onClick={onUpload}
                  disabled={!file || busy}
                  className="px-3 py-2 text-sm border border-neutral-300 rounded-md hover:bg-neutral-100 disabled:opacity-60"
                >
                  업로드
                </button>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => onSelectFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


