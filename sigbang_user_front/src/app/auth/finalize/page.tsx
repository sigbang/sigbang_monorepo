"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { getOrCreateDeviceId, getDeviceName } from '@/lib/auth/device';
import { useSession, signOut } from '@/lib/auth/session';
import { useRouter } from 'next/navigation';

export default function FinalizeAuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (status !== 'authenticated') return;
      const idToken = (session as any)?.id_token as string | undefined;
      if (!idToken) {
        setError('Missing id_token from session');
        return;
      }
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken, deviceId: getOrCreateDeviceId(), deviceName: getDeviceName() }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          setError(text || 'Failed to finalize auth');
          return;
        }
        router.replace('/');
      } catch (e) {
        setError('Network error');
      }
    };
    run();
  }, [status, session, router]);

  if (status === 'loading') return <main style={{ padding: 24 }}>로그인 처리 중...</main>;

  return (
    <main style={{ padding: 24 }}>
      <div>로그인 완료 처리 중...</div>
      {error && (
        <div style={{ marginTop: 12, color: 'red' }}>
          {error} <button onClick={() => signOut()}>다시 로그인</button>
        </div>
      )}
    </main>
  );
}


