'use client';

import { useMemo, useRef } from 'react';

type DiscreteSliderProps = {
  marks: number[]; // e.g., [10, 30, 60]
  value: number; // one of marks
  onChange: (next: number) => void;
  className?: string;
};

export default function DiscreteSlider({ marks, value, onChange, className }: DiscreteSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const { currentIndex, percent } = useMemo(() => {
    const count = Math.max(1, marks.length - 1);
    let idx = marks.findIndex((m) => m === value);
    if (idx < 0) {
      // fallback to nearest
      idx = marks.reduce((bestIdx, m, i) => {
        const best = Math.abs(marks[bestIdx] - value);
        const cur = Math.abs(m - value);
        return cur < best ? i : bestIdx;
      }, 0);
    }
    const p = (idx / count) * 100;
    return { currentIndex: idx, percent: p };
  }, [marks, value]);

  const setByClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const idx = Math.round(ratio * (marks.length - 1));
    onChange(marks[idx]);
  };

  const onTrackClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    setByClientX(e.clientX);
  };

  const onThumbPointerDown: React.PointerEventHandler<HTMLButtonElement> = (e) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => setByClientX(ev.clientX);
    const up = () => {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = Math.max(0, currentIndex - 1);
      onChange(marks[nextIdx]);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIdx = Math.min(marks.length - 1, currentIndex + 1);
      onChange(marks[nextIdx]);
    }
  };

  return (
    <div className={`px-6 ${className ?? ''}`}>
      {/* Labels positioned at 0%, 50%, 100% */}
      <div className="relative h-6 mb-2 select-none text-sm font-semibold text-neutral-600">
        {marks.map((m, i) => {
          const p = (i / Math.max(1, marks.length - 1)) * 100;
          return (
            <div
              key={i}
              className="absolute top-0 -translate-x-1/2 text-center"
              style={{ left: `${p}%` }}
            >
              {m}
            </div>
          );
        })}
      </div>
      <div
        ref={trackRef}
        className="relative h-3 rounded-full bg-neutral-200 dark:bg-neutral-800 cursor-pointer"
        onClick={onTrackClick}
        role="presentation"
      >
        <div
          className="absolute top-0 left-0 h-3 rounded-full bg-amber-400"
          style={{ width: `${percent}%` }}
        />
        <button
          type="button"
          role="slider"
          aria-valuemin={marks[0]}
          aria-valuemax={marks[marks.length - 1]}
          aria-valuenow={value}
          onPointerDown={onThumbPointerDown}
          onKeyDown={onKeyDown}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 bg-amber-400 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-amber-400"
          style={{ left: `${percent}%` }}
          aria-label="조리시간"
        />
      </div>
    </div>
  );
}


