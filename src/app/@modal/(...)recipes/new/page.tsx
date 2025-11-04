'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createRecipe } from '@/lib/api/recipes';

const RecipeForm = dynamic(() => import('@/components/RecipeForm'), {
  ssr: false,
  loading: () => <div className="min-h-[320px] flex items-center justify-center">폼 로딩...</div>,
});

export default function NewRecipeModalPage() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(false);

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
            onBusyChange={setBusy}
            onSubmit={async (dto) => {
              await createRecipe(dto);
              setCompleted(true);
              setTimeout(() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }, 2000);
            }}
          />
        </div>
      </div>
      {(busy || completed) && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-[120] flex flex-col items-center gap-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl px-8 py-10">
            {completed ? (
              <>
                <svg className="h-16 w-16 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <div className="text-lg font-semibold">업로드가 완료되었습니다</div>
                <div className="text-sm text-neutral-500">2초 후 창이 닫힙니다</div>
              </>
            ) : (
              <>
                <svg className="animate-spin h-14 w-14 text-black dark:text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <div className="text-lg font-semibold">업로드 중...</div>
                <div className="text-sm text-neutral-500">창을 닫지 마세요</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


