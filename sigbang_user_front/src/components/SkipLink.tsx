'use client';
import { useT } from '@/i18n/I18nProvider';

export default function SkipLink() {
  const t = useT();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-black focus:text-white focus:px-3 focus:py-2 focus:rounded"
    >
      {t('skipLink')}
    </a>
  );
}


