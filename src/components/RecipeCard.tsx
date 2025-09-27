'use client';
import Image from 'next/image';
import { IconClock } from './icons';

export default function RecipeCard({
  title,
  minutes,
  image,
  active,
}: {
  title: string;
  minutes?: number;
  image: string;
  active?: boolean;
}) {
  return (
    <div style={{ width: 320 }} className={active ? 'ring-2 ring-sky-500 rounded-[12px]' : ''}>
      <div style={{ width: 320, height: 180, borderRadius: 12, overflow: 'hidden', background: '#eee' }}>
        <Image src={image} alt={title} priority sizes="(max-width: 768px) 100vw, 320px" width={320} height={180} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ marginTop: 8 }} className="text-[14px] text-[#222]">{title}</div>
      <div className="flex items-center gap-1 text-[12px] text-[#666]">
        <IconClock />
        <span>{minutes ?? 60} mins</span>
      </div>
    </div>
  );
}


