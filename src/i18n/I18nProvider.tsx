'use client';
import { createContext, useContext } from 'react';
import type { Locale } from './index';

type Dict = Record<string, any>;

const I18nContext = createContext<{ locale: Locale; dict: Dict }>({ locale: 'ko', dict: {} });

export function I18nProvider({ children, locale, dict }: { children: React.ReactNode; locale: Locale; dict: Dict }) {
  return <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>;
}

export function useT() {
  const { dict } = useContext(I18nContext);
  return (path: string) => {
    const parts = path.split('.');
    let cur: any = dict;
    for (const p of parts) {
      cur = cur?.[p];
      if (cur == null) return path;
    }
    return typeof cur === 'string' ? cur : path;
  };
}


