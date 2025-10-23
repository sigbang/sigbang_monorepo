'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginModalHost() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    }
    window.addEventListener('open-login-modal', onOpen as EventListener);
    window.addEventListener('keydown', onKeyDown, { capture: true } as AddEventListenerOptions);
    return () => {
      window.removeEventListener('open-login-modal', onOpen as EventListener);
      window.removeEventListener('keydown', onKeyDown as EventListener);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[420px] rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl p-6">
          <div className="text-[20px] font-semibold text-[#111]">로그인이 필요합니다</div>
          <div className="mt-2 text-[14px] text-[#555]">좋아요, 저장 기능을 사용하려면 로그인해 주세요.</div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              className="px-4 h-10 rounded-md border border-[#eee] hover:bg-neutral-50"
              onClick={() => setOpen(false)}
            >
              취소
            </button>
            <button
              type="button"
              className="px-4 h-10 rounded-md bg-black text-white hover:opacity-90"
              onClick={() => {
                setOpen(false);
                router.push('/login');
              }}
            >
              로그인 하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


