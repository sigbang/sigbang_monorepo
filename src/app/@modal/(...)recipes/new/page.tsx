'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import RecipeForm from '@/components/RecipeForm';
import { createRecipe } from '@/lib/api/recipes';

export default function NewRecipeModalPage() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (window.confirm('작성 중인 내용이 사라질 수 있습니다. 닫으시겠어요?')) {
          router.back();
        }
      }
    };
    const opts: AddEventListenerOptions = { capture: true };
    window.addEventListener('keydown', onKeyDown, opts);
    return () => window.removeEventListener('keydown', onKeyDown, opts as EventListenerOptions);
  }, [router]);

  useEffect(() => {
    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.getPropertyValue('touch-action');
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.setProperty('touch-action', 'none');
    return () => {
      html.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.setProperty('touch-action', prevTouchAction || '');
    };
  }, []);

  const close = () => {
    if (window.confirm('작성 중인 내용이 사라질 수 있습니다. 닫으시겠어요?')) {
      router.back();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overscroll-none" aria-hidden={false} aria-modal={true} role="dialog" onWheel={(e) => e.preventDefault()} onTouchMove={(e) => e.preventDefault()}>
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
        onClick={close}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div ref={dialogRef} className="w-full max-w-[480px]">
          <RecipeForm
            embedded
            mode="create"
            onCancel={close}
            onSubmit={async (dto) => {
              const id = await createRecipe(dto);
              alert(`레시피 업로드 완료: ${id}`);
              router.push('/');
            }}
          />
        </div>
      </div>
    </div>
  );
}


