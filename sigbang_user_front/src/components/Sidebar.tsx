'use client';
import { useT } from '@/i18n/I18nProvider';
import HomeIcon from './icons/HomeIcon';
import SearchIcon from './icons/SearchIcon';
import CompassIcon from './icons/CompassIcon';
import PlusIcon from './icons/PlusIcon';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppMenuButton from './AppMenuButton';

export default function Sidebar() {
  const t = useT();
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };
  return (
    <aside className="hidden sm:flex sm:flex-col sm:w-[200px] border-r border-[#eee] px-4 pt-6 gap-6" aria-label="사이드바 내비게이션">      
      <nav className="flex flex-col gap-3 text-[18px]">
        <Link className={`flex items-center gap-2 rounded text-[#6b7280] hover:text-black ${isActive('/') ? 'text-black' : ''}`} href="/" aria-current={isActive('/') ? 'page' : undefined}><HomeIcon size={24} filled={isActive('/')} />{t('nav.home')}</Link>
        <Link className={`flex items-center gap-2 rounded text-[#6b7280] hover:text-black ${isActive('/search') ? 'text-black' : ''}`} href="/search" aria-current={isActive('/search') ? 'page' : undefined}><SearchIcon size={24} filled={isActive('/search')} />{t('nav.search')}</Link>
        <Link className={`flex items-center gap-2 rounded text-[#6b7280] hover:text-black ${isActive('/feed/explore') ? 'text-black' : ''}`} href="/feed/explore" aria-current={isActive('/feed/explore') ? 'page' : undefined}><CompassIcon size={24} filled={isActive('/feed/explore')} />{t('nav.explore')}</Link>
        <Link className={`flex items-center gap-2 rounded text-[#6b7280] hover:text-black ${isActive('/recipes/import') ? 'text-black' : ''}`} href="/recipes/import" aria-current={isActive('/recipes/import') ? 'page' : undefined}><PlusIcon size={24} filled={isActive('/recipes/import')} />가져오기</Link>
        <Link className={`flex items-center gap-2 rounded text-[#6b7280] hover:text-black ${isActive('/recipes/new') ? 'text-black' : ''}`} href="/recipes/new" aria-current={isActive('/recipes/new') ? 'page' : undefined}><PlusIcon size={24} filled={isActive('/recipes/new')} />{t('nav.create')}</Link>
        <AppMenuButton menuPosition="left" variant="nav" />
      </nav>
    </aside>
  );
}


