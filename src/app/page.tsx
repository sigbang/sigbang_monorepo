"use client";
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import Section from '@/components/Section';
import MobileNav from '@/components/MobileNav';
import { useT } from '@/i18n/I18nProvider';
import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from '@/hooks/useHotkeys';

export default function Home() {
  const t = useT();
  const nowItems: any[] = [];
  const recommendItems: any[] = [];
  const mainRef = useRef<HTMLElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);

  useHotkeys({
    'g': () => mainRef.current?.focus(),
    'Ctrl+ArrowRight': (e) => { e.preventDefault(); setFocusIndex((i) => i + 1); },
    'Ctrl+ArrowLeft': (e) => { e.preventDefault(); setFocusIndex((i) => Math.max(0, i - 1)); },
  });

  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[1200px] flex">
        <Sidebar />
        <main id="main" className="flex-1 px-6 py-6 focus:outline-none" role="main" tabIndex={-1} ref={mainRef}>
          <div className="text-center mb-6">
            <div className="text-[14px] text-[#111] font-semibold">{t('welcome.title')}</div>
            <div className="text-[12px] text-[#777] mt-1">{t('welcome.subtitle')}</div>
          </div>
          <Section title={t('sections.now')} items={nowItems} />
          <div className="h-[24px]" />
          <Section title={t('sections.recommend')} items={recommendItems} highlightFirst />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
