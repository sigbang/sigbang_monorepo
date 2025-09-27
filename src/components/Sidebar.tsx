'use client';
import { IconHome, IconSearch, IconCompass, IconPlus } from './icons';

export default function Sidebar() {
  return (
    <aside className="hidden sm:flex sm:flex-col sm:w-[200px] border-r border-[#eee] px-4 pt-6 gap-6" aria-label="사이드바 내비게이션">
      <div className="flex items-center gap-2 text-[18px] font-semibold">
        <span role="img" aria-label="logo">🍳</span>
        <span>식방</span>
      </div>
      <nav className="flex flex-col gap-3 text-[14px] text-[#333]">
        <a className="flex items-center gap-2 hover:text-black focus:outline-none focus:ring-2 focus:ring-sky-500 rounded" href="/" aria-current="page"><IconHome />홈</a>
        <a className="flex items-center gap-2 hover:text-black focus:outline-none focus:ring-2 focus:ring-sky-500 rounded" href="#"><IconSearch />검색</a>
        <a className="flex items-center gap-2 hover:text-black focus:outline-none focus:ring-2 focus:ring-sky-500 rounded" href="#"><IconCompass />탐색</a>
        <a className="flex items-center gap-2 hover:text-black focus:outline-none focus:ring-2 focus:ring-sky-500 rounded" href="/recipes/new"><IconPlus />생성</a>
      </nav>
    </aside>
  );
}


