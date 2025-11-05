"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ensureDeviceCookie } from '@/lib/auth/device';
import { useSessionKeepAlive } from '@/hooks/useSessionKeepAlive';
import LoginModalHost from '@/components/LoginModalHost';

export default function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: (count, err: any) => {
          const status = (err as any)?.response?.status;
          if (status && status < 500) return false;
          return count < 2;
        },
      },
      mutations: {
        retry: 0,
      },
    },
  }));
  useEffect(() => {
    ensureDeviceCookie();
  }, []);
  useSessionKeepAlive();
  return (
    <SessionProvider>
      <QueryClientProvider client={qc}>
        {children}
        <LoginModalHost />
      </QueryClientProvider>
    </SessionProvider>
  );
}


