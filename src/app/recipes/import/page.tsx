'use client';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import RecipeForm from '@/components/RecipeForm';
import { createRecipe } from '@/lib/api/recipes';
import { toRecipeDetail } from '@/lib/external/foodsafety';

type Item = Record<string, any>;

export default function ImportFoodsafetyPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Item | null>(null);

  const initial = useMemo(() => (selected ? toRecipeDetail(selected) : undefined), [selected]);

  const search = async () => {
    setLoading(true);
    try {
      const isIdx = /^\d+$/.test(q.trim());
      const url = isIdx
        ? `/api/import/foodsafety/recipes?idx=${encodeURIComponent(q.trim())}`
        : `/api/import/foodsafety/recipes?q=${encodeURIComponent(q)}&page=1&pageSize=20`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `요청 실패 (${res.status})`);
      }
      const json = await res.json();
      if (!json?.data) {
        throw new Error(json?.message || '응답 형식 오류');
      }
      const nextItems: Item[] = json.data.items ?? [];
      setItems(nextItems);
      if (isIdx) {
        // Single index fetch returns 0 or 1 item; open immediately when present
        if (nextItems.length > 0) setSelected(nextItems[0]);
      } else {
        // If user typed a numeric id, try auto-select if present in results
        if (/^\d+$/.test(q)) {
          const found = nextItems.find((it) => String(it?.RCP_SEQ ?? '') === q);
          if (found) setSelected(found);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`검색 실패: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  if (selected && initial) {
    return (
      <RecipeForm
        mode="create"
        initial={initial}
        embedded
        onCancel={() => setSelected(null)}
        onSubmit={async (dto) => {
          const id = await createRecipe(dto);
          alert(`레시피 업로드 완료: ${id}`);
          router.push('/');
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-[820px] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b border-neutral-200 dark:border-neutral-800 p-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">식품안전나라 레시피 가져오기</h1>
          <button onClick={() => router.back()} className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="닫기">✕</button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="메뉴명 또는 번호(RCP_SEQ)를 입력하세요"
              className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md"
            />
            <button onClick={search} disabled={loading} className="px-4 py-2 bg-black text-white rounded-md">
              {loading ? '검색 중...' : '검색'}
            </button>
          </div>

          <ul className="grid grid-cols-1 gap-3">
            {items.length === 0 && (
              <li className="text-sm text-neutral-500">검색 결과가 없습니다. 다른 키워드로 시도해 보세요.</li>
            )}
            {items.map((it) => (
              <li key={String(it.RCP_SEQ ?? Math.random())}
                  className="border border-neutral-200 dark:border-neutral-800 rounded-md p-3 flex gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer"
                  onClick={() => setSelected(it)}>
                <div className="relative w-24 h-24 rounded-md overflow-hidden bg-neutral-200">
                  <Image src={(it.ATT_FILE_NO_MAIN || it.ATT_FILE_NO_MK) as string}
                         alt=""
                         fill sizes="96px" style={{ objectFit: 'cover' }} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{it.RCP_NM}</div>
                  <div className="text-xs text-neutral-500 mt-1">
                    #{it.RCP_SEQ} · {it.RCP_PAT2} · {it.RCP_WAY2} {it.HASH_TAG ? `· ${it.HASH_TAG}` : ''}
                  </div>
                  <div className="text-xs line-clamp-2 mt-1">{it.RCP_PARTS_DTLS}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-800 p-3 text-xs text-neutral-500">
          검색 후 항목을 클릭하면 폼으로 가져옵니다. 업로드 전 이미지/단계/재료를 확인하세요.
        </div>
      </div>
    </div>
  );
}


