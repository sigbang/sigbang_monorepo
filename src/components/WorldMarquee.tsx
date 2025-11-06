'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type MarqueeImage = { src: string; alt?: string };

type WorldMarqueeProps = {
  images?: MarqueeImage[];
  speedPxPerSec?: number; // how fast to slide left
  gapPx?: number; // gap between items
  itemSizePx?: number; // square size per item
};

export default function WorldMarquee({
  images,
  speedPxPerSec = 40,
  gapPx = 12,
  itemSizePx = 120,
}: WorldMarqueeProps) {
  const fallback = useMemo<MarqueeImage[]>(() => (
    Array.from({ length: 12 }, (_, i) => ({ src: '', alt: `이미지 ${i + 1}` }))
  ), []);
  const data = images && images.length > 0 ? images : fallback;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [cycleWidth, setCycleWidth] = useState(0); // width of one data cycle
  const repeats = useMemo(() => {
    if (cycleWidth === 0) return 2;
    return Math.max(2, Math.ceil(containerWidth / cycleWidth) + 2);
  }, [containerWidth, cycleWidth]);
  const duplicated = useMemo(() => Array.from({ length: repeats }, () => data).flat(), [data, repeats]);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0); // px
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const measure = useCallback(() => {
    // one cycle = number of items * (itemSize + gap) - last gap
    const oneItem = itemSizePx + gapPx;
    const width = data.length * oneItem - gapPx; // remove trailing gap
    setCycleWidth(width);
    const cw = containerRef.current?.offsetWidth ?? 0;
    setContainerWidth(cw);
  }, [data.length, gapPx, itemSizePx]);

  useEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [measure]);

  useEffect(() => {
    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;
      const delta = (speedPxPerSec * dt) / 1000; // px
      setOffset((prev) => {
        let next = prev + delta;
        if (cycleWidth > 0 && next >= cycleWidth) {
          // wrap seamlessly, keep remainder to avoid stutter
          next = next - cycleWidth;
        }
        return next;
      });
      rafRef.current = window.requestAnimationFrame(step);
    };
    rafRef.current = window.requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [cycleWidth, speedPxPerSec]);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden" role="region" aria-label="전세계 요리 마퀴">
      <div
        ref={trackRef}
        className="flex will-change-transform"
        style={{
          transform: `translateX(-${offset}px)`,
          transition: 'transform 16ms linear',
          gap: `${gapPx}px`,
        }}
      >
        {duplicated.map((img, i) => (
          <div key={i} style={{ width: itemSizePx, height: itemSizePx }} className="relative rounded-xl bg-white border border-[#ddd] shrink-0">
            {img.src ? (
              <img src={img.src} alt={img.alt || ''} className="absolute inset-0 w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-[#bbb] text-[#888] text-xs rounded-xl">
                {img.alt || '이미지'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


