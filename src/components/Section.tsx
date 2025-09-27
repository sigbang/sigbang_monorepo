'use client';
import RecipeCard from './RecipeCard';

export default function Section({
  title,
  items,
  highlightFirst,
}: {
  title: string;
  items: Array<{ id: string; title: string; image: string; minutes?: number }>;
  highlightFirst?: boolean;
}) {
  const isEmpty = !items || items.length === 0;
  return (
    <section style={{ marginTop: 24 }} aria-labelledby={`${title}-heading`}>
      <h3 id={`${title}-heading`} className="text-[14px] font-semibold text-[#222] mb-3">{title}</h3>
      {isEmpty ? (
        <div role="status" aria-live="polite" className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">오류: 컨텐츠가 아직 준비되지 않았습니다.</div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((it, idx) => (
            <RecipeCard key={it.id} title={it.title} image={it.image} minutes={it.minutes} active={highlightFirst && idx === 0} />
          ))}
        </div>
      )}
    </section>
  );
}


