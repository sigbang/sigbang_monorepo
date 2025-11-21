'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function MainBanner() {
  // 이미지 준비 전까지는 플레이스홀더를 보여준다.
  // 실제 배너 이미지를 추가하면 src 경로만 교체하면 된다.
  const bannerSrc = '/banners/main-feedback.png'; // 추후 에셋 경로로 교체
  const hasImage = false; // 이미지 추가 후 true 처리 또는 존재 체크 로직으로 교체

  return (
    <div className="mb-4">
      <Link href="/feedback" className="block group" aria-label="피드백 보내기 배너">
        <div
          className="relative w-full rounded-2xl overflow-hidden bg-[#f5f5f5]"
          style={{ aspectRatio: '3 / 1' }} // 기본 3:1 비율
        >
          {hasImage ? (
            <Image
              src={bannerSrc}
              alt="피드백 보내기"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 776px, 952px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[14px] text-[#888]">피드백 배너 (이미지 준비 중)</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}


