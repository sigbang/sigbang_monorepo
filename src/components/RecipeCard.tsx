'use client';
import Image from 'next/image';
import { forwardRef } from 'react';
import { IconClock } from './icons';

type Props = {
  title: string;
  minutes?: number;
  image: string;
  active?: boolean;
  tabIndex?: number;
};

const BLUR_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9" width="320" height="180"><rect width="100%" height="100%" fill="#e5e7eb"/></svg>');

const RecipeCard = forwardRef<HTMLDivElement, Props>(function RecipeCard(
  { title, minutes, image, active, tabIndex },
  ref
) {
  return (
    <div ref={ref} tabIndex={tabIndex} style={{ width: 320 }} className={(active ? 'ring-2 ring-sky-500 ' : '') + 'rounded-[12px] focus:outline-none focus:ring-2 focus:ring-sky-500'}>
      <div style={{ width: 320, height: 180, borderRadius: 12, overflow: 'hidden', background: '#eee' }}>
        {image ? (
          <Image src={image} alt={title} priority sizes="(max-width: 768px) 100vw, 320px" width={320} height={180} placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
            이미지 없음
          </div>
        )}
      </div>
      <div style={{ marginTop: 8 }} className="text-[14px] text-[#222]">{title}</div>
      <div className="flex items-center gap-1 text-[12px] text-[#666]">
        <IconClock />
        <span>{minutes ?? 60} mins</span>
      </div>
    </div>
  );
});

export default RecipeCard;


