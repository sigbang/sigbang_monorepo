'use client';

import { useEffect, useRef } from 'react';

const KEEPALIVE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const NETWORK_CHECK_INTERVAL_MS = 30 * 1000; // 30 seconds

export function useSessionKeepAlive() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const networkCheckRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const performKeepAlive = async () => {
      try {
        // Use the new validation endpoint for more efficient keep-alive
        await fetch('/api/auth/validate', { 
          method: 'POST',
          cache: 'no-store' 
        });
      } catch {}
    };

    const onVisible = async () => {
      if (document.visibilityState === 'visible') {
        await performKeepAlive();
      }
    };

    const onOnline = async () => {
      // When network comes back online, perform keep-alive
      await performKeepAlive();
    };

    // Visibility change listener
    document.addEventListener('visibilitychange', onVisible);
    
    // Network online listener
    window.addEventListener('online', onOnline);

    // Periodic keep-alive (only when tab is visible)
    intervalRef.current = setInterval(async () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        await performKeepAlive();
      }
    }, KEEPALIVE_INTERVAL_MS);

    // Network status check
    networkCheckRef.current = setInterval(async () => {
      if (navigator.onLine && document.visibilityState === 'visible') {
        await performKeepAlive();
      }
    }, NETWORK_CHECK_INTERVAL_MS);

    // Initial keep-alive
    performKeepAlive();

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (networkCheckRef.current) clearInterval(networkCheckRef.current);
    };
  }, []);
}


