'use client';

export default function Topbar() {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-[#eee]">
      <div className="mx-auto max-w-[1040px] px-4 py-3 flex items-center justify-between">
        <div className="text-[14px] text-[#888]">식방에 오신 것을 환영합니다!</div>
        <div className="w-8 h-8 rounded-full bg-[#ddd]" />
      </div>
    </header>
  );
}


