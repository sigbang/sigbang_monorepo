'use client';
import { IconHome, IconSearch, IconCompass, IconPlus } from './icons';
import { t } from '@/i18n';

export default function MobileNav() {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#eee]">
      <ul className="grid grid-cols-4 text-[12px] text-[#444]">
        <li>
          <a href="/" className="flex flex-col items-center py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" aria-current="page">
            <IconHome />
            <span>{t('nav.home')}</span>
          </a>
        </li>
        <li>
          <a href="#" className="flex flex-col items-center py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
            <IconSearch />
            <span>{t('nav.search')}</span>
          </a>
        </li>
        <li>
          <a href="#" className="flex flex-col items-center py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
            <IconCompass />
            <span>{t('nav.explore')}</span>
          </a>
        </li>
        <li>
          <a href="/recipes/new" className="flex flex-col items-center py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
            <IconPlus />
            <span>{t('nav.create')}</span>
          </a>
        </li>
      </ul>
    </nav>
  );
}


