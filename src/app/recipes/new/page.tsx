'use client';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createRecipe } from '@/lib/api/recipes';

const RecipeForm = dynamic(() => import('@/components/RecipeForm'), {
  ssr: false,
  loading: () => <div className="min-h-[320px] flex items-center justify-center">폼 로딩...</div>,
});

export default function NewRecipePage() {
  const router = useRouter();
  return (
    <RecipeForm
      mode="create"
      onCancel={() => router.back()}
      onSubmit={async (dto) => {
        const { id } = await createRecipe(dto);
        alert(`레시피 업로드 완료: ${id}`);
        try {
          const resp = await fetch(`/api/proxy/recipes/${id}/slug`);
          if (resp.ok) {
            const b: unknown = await resp.json().catch(() => null);
            let slug: string | undefined;
            if (b && typeof b === 'object' && b !== null) {
              const v = (b as Record<string, unknown>)['slug'];
              if (typeof v === 'string') slug = v;
            }
            if (slug) {
              router.push(`/recipes/${slug}`);
              return;
            }
          }
        } catch {}
        router.push(`/recipes/${id}`);
      }}
    />
  );
}


