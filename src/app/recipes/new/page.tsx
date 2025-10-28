'use client';
import { useRouter } from 'next/navigation';
import RecipeForm from '@/components/RecipeForm';
import { createRecipe } from '@/lib/api/recipes';

export default function NewRecipePage() {
  const router = useRouter();
  return (
    <RecipeForm
      mode="create"
      onCancel={() => router.back()}
      onSubmit={async (dto) => {
        const { id } = await createRecipe(dto);
        alert(`레시피 업로드 완료: ${id}`);
        // 응답에 thumbnailImage가 포함되므로 재조회 없이 상세 이동
        router.push(`/recipes/${id}`);
      }}
    />
  );
}


