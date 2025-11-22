"use client";

import { ReactNode } from 'react';
import { useMyProfile } from '@/lib/hooks/users';

type SessionUser = {
  name?: string;
  email?: string;
  image?: string;
};

type SessionData = {
  user?: SessionUser | null;
};

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function useSession(): { data: SessionData | null; status: SessionStatus } {
  const me = useMyProfile();
  if (me.isLoading) return { data: null, status: 'loading' };
  const user: SessionUser | null = me.data
    ? {
        name: me.data.name ?? undefined,
        email: me.data.email ?? undefined,
        image: me.data.image ?? undefined,
      }
    : null;
  return {
    data: user ? { user } : null,
    status: user ? 'authenticated' as const : 'unauthenticated' as const,
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export async function signOut(opts?: { callbackUrl?: string }) {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {}
  const target = opts?.callbackUrl || '/';
  if (typeof window !== 'undefined') {
    window.location.assign(target);
  }
}


