'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RecipeForm from '@/components/RecipeForm';
import { getRecipe, updateRecipe, RecipeDetail } from '@/lib/api/recipes';

export default function EditRecipePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [initial, setInitial] = useState<RecipeDetail | null>(null);

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;
    getRecipe(id)
      .then(setInitial)
      .catch(() => {
        alert('레시피 로딩 실패');
        router.back();
      });
  }, [params, router]);

  if (!initial) return null;

  return (
    <RecipeForm
      mode="edit"
      initial={initial}
      onCancel={() => router.back()}
      onSubmit={async (dto) => {
        await updateRecipe(initial.id, dto);
        alert('수정 완료');
        router.push(`/recipes/${initial.id}`);
      }}
    />
  );
}


