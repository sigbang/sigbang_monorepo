import { ko } from './ko';

export type Locale = 'ko';

const dictionaries = { ko } as const;

export function t(path: string, locale: Locale = 'ko'): string {
  const parts = path.split('.');
  let cur: any = dictionaries[locale];
  for (const p of parts) {
    cur = cur?.[p];
    if (cur == null) return path;
  }
  return typeof cur === 'string' ? cur : path;
}

export async function loadDictionary(locale: Locale) {
  switch (locale) {
    case 'ko':
    default:
      return dictionaries.ko;
  }
}


