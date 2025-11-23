"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ReactNode } from 'react';
import type { MyProfile } from '@/lib/api/users';

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
  const qc = useQueryClient();

  const validate = useQuery({
    queryKey: ['auth', 'validate'],
    queryFn: async () => {
      const res = await fetch('/api/auth/validate', { method: 'POST', cache: 'no-store' });
      // The endpoint always returns 200 with a { valid, hasToken } payload
      try {
        return (await res.json()) as { valid?: boolean; hasToken?: boolean } | null;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  if (validate.isLoading) return { data: null, status: 'loading' };

  const isAuthed = !!validate.data?.valid && !!validate.data?.hasToken;

  // Optionally surface cached profile as session user (no extra fetch here)
  const me = qc.getQueryData<MyProfile>(['me']);
  const user: SessionUser | null =
    isAuthed && me
      ? {
          name: me.name ?? undefined,
          email: undefined,
          image: me.image ?? undefined,
        }
      : null;

  return { data: user ? { user } : null, status: isAuthed ? 'authenticated' : 'unauthenticated' };
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


