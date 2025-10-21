'use client';
import RecipeCard from './RecipeCard';
import { useT } from '@/i18n/I18nProvider';
import { useEffect, useRef } from 'react';

export default function Section({
  title,
  items,
  highlightFirst,
  startIndex = 0,
  focusIndex,
}: {
  title: string;
  items: Array<{ id: string; title: string; image: string; minutes?: number; description?: string; likesCount?: number; authorAvatar?: string; liked?: boolean; saved?: boolean }>;
  highlightFirst?: boolean;
  startIndex?: number;
  focusIndex?: number;
}) {
  const t = useT();
  const isEmpty = !items || items.length === 0;
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (focusIndex == null) return;
    const local = focusIndex - startIndex;
    if (local >= 0 && local < items.length) {
      const el = cardRefs.current[local];
      el?.focus();
    }
  }, [focusIndex, startIndex, items.length]);
  return (
    <section style={{ marginTop: 24 }} aria-labelledby={`${title}-heading`}>
      <h3 id={`${title}-heading`} className="text-[14px] font-semibold text-[#222] mb-3">{title}</h3>
      {isEmpty ? (
        <div role="status" aria-live="polite" className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{t('errors.empty')}</div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
          {items.map((it, idx) => (
            <RecipeCard
              key={it.id}
              ref={(el) => (cardRefs.current[idx] = el)}
              tabIndex={idx === 0 ? 0 : -1}
              recipeId={it.id}
              title={it.title}
              image={it.image}
              minutes={it.minutes}
              description={it.description}
              likesCount={it.likesCount}
              authorAvatar={it.authorAvatar}
              liked={it.liked}
              saved={it.saved}
              active={highlightFirst && idx === 0}
              href={`/recipes/${it.id}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}


