"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ensureDeviceCookie } from '@/lib/auth/device';
import { useSessionKeepAlive } from '@/hooks/useSessionKeepAlive';
import LoginModalHost from '@/components/LoginModalHost';

export default function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient());
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


