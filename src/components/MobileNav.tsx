'use client';
//
import HomeIcon from './icons/HomeIcon';
import SearchIcon from './icons/SearchIcon';
import CompassIcon from './icons/CompassIcon';
import PlusIcon from './icons/PlusIcon';
import Link from 'next/link';
import { useT } from '@/i18n/I18nProvider';

export default function MobileNav() {
  const t = useT();
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#eee]">
      <ul className="grid grid-cols-4 text-[12px] text-[#444]">
        <li>
          <Link href="/" className="flex flex-col items-center py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" aria-current="page">
            <HomeIcon size={20} />
            <span>{t('nav.home')}</span>
          </Link>
        </li>
        <li>
          <Link href="/search" className="flex flex-col items-center py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
            <SearchIcon size={20} />
            <span>{t('nav.search')}</span>
          </Link>
        </li>
        <li>
          <a href="#" className="flex flex-col items-center py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
            <CompassIcon size={20} />
            <span>{t('nav.explore')}</span>
          </a>
        </li>
        <li>
          <Link href="/recipes/new" className="flex flex-col items-center py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
            <PlusIcon size={20} />
            <span>{t('nav.create')}</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}


