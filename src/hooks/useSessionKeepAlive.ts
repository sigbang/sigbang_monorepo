'use client';

import { useEffect } from 'react';

export function useSessionKeepAlive() {
  useEffect(() => {
    const onVisible = async () => {
      if (document.visibilityState === 'visible') {
        try {
          await fetch('/api/proxy/users/me', { cache: 'no-store' });
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);
}


