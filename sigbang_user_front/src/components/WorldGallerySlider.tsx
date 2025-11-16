'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type WorldGallerySliderProps = {
  images?: { src: string; alt?: string }[];
  autoPlayMs?: number;
};

export default function WorldGallerySlider({ images, autoPlayMs = 3500 }: WorldGallerySliderProps) {
  const fallback = useMemo(() => (
    new Array(6).fill(0).map((_, i) => ({ src: '', alt: `이미지 ${i + 1}` }))
  ), []);
  const slides = images && images.length > 0 ? images : fallback;
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!autoPlayMs) return;
    timerRef.current && window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, autoPlayMs);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [autoPlayMs, slides.length]);

  const go = (to: number) => {
    if (to < 0) to = slides.length - 1;
    if (to >= slides.length) to = 0;
    setIndex(to);
  };

  return (
    <div className="relative w-full max-w-[800px] mx-auto" role="region" aria-label="전세계 요리 슬라이더">
      <div className="overflow-hidden rounded-2xl border border-[#ddd] bg-white">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => (
            <div key={i} className="w-full shrink-0">
              <div className="w-full aspect-square relative">
                {s.src ? (
                  // 실제 이미지가 준비되면 img 또는 next/image로 교체 가능
                  <img src={s.src} alt={s.alt || ''} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-[#bbb] text-[#888] text-sm">
                    {s.alt || '이미지'} · 1200x1200 · WebP
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 -bottom-10 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => go(index - 1)}
          className="px-3 py-1 text-sm border border-[#ddd] rounded bg-white hover:bg-neutral-50"
          aria-label="이전"
        >
          이전
        </button>
        <div className="flex items-center gap-1" aria-label="슬라이드 위치 표시">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              className={`w-2.5 h-2.5 rounded-full ${i === index ? 'bg-amber-600' : 'bg-[#ccc]'}`}
              aria-current={i === index ? 'true' : undefined}
              aria-label={`${i + 1}번 슬라이드로 이동`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(index + 1)}
          className="px-3 py-1 text-sm border border-[#ddd] rounded bg-white hover:bg-neutral-50"
          aria-label="다음"
        >
          다음
        </button>
      </div>
    </div>
  );
}


