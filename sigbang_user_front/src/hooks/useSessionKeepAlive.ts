'use client';

import { useEffect } from 'react';

/**
 * Lightweight session keep-alive.
 *
 * 과거에는 visibility / online 이벤트와 주기적인 타이머로
 * /api/auth/validate 를 자주 호출했지만, 관리 복잡도와 트래픽을 줄이기 위해
 * 이제는 마운트 시 한 번만 best-effort 호출만 수행합니다.
 *
 * 실제 세션 상태 관리는 useSession(React Query)와 axios 인터셉터가 담당합니다.
 */
export function useSessionKeepAlive() {
  useEffect(() => {
    (async () => {
      try {
        await fetch('/api/auth/validate', {
          method: 'POST',
          cache: 'no-store',
        });
      } catch {
        // keep-alive 실패는 UI에 영향을 주지 않음
      }
    })();
  }, []);
}

