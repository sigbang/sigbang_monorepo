'use client';
import { useT } from '@/i18n/I18nProvider';
import HomeIcon from './icons/HomeIcon';
import SearchIcon from './icons/SearchIcon';
import CompassIcon from './icons/CompassIcon';
import PlusIcon from './icons/PlusIcon';
import Link from 'next/link';

export default function Sidebar() {
  const t = useT();
  return (
    <aside className="hidden sm:flex sm:flex-col sm:w-[200px] border-r border-[#eee] px-4 pt-6 gap-6" aria-label="사이드바 내비게이션">      
      <nav className="flex flex-col gap-3 text-[18px] text-[#333]">
        <Link className="flex items-center gap-2 hover:text-black focus:outline-none focus:ring-2 focus:ring-sky-500 rounded" href="/" aria-current="page"><HomeIcon size={24} />{t('nav.home')}</Link>
        <a className="flex items-center gap-2 hover:text-black focus:outline-none focus:ring-2 focus:ring-sky-500 rounded" href="#"><SearchIcon size={24} />{t('nav.search')}</a>
        <Link className="flex items-center gap-2 hover:text-black focus:outline-none focus:ring-2 focus:ring-sky-500 rounded" href="/feed/explore"><CompassIcon size={24} />{t('nav.explore')}</Link>
        <Link className="flex items-center gap-2 hover:text-black focus:outline-none focus:ring-2 focus:ring-sky-500 rounded" href="/recipes/new"><PlusIcon size={24} />{t('nav.create')}</Link>
      </nav>
    </aside>
  );
}


