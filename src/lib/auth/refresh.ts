'use server';

import { ENV } from '@/lib/env';
import { getAccessToken, getRefreshToken, setTokens } from './cookies';
import { getExp } from './jwt';

let refreshPromise: Promise<boolean> | null = null;

export async function ensureValidAccessToken(): Promise<string | null> {
  const at = await getAccessToken();
  if (at) return at;
  const ok = await refreshTokens();
  return ok ? await getAccessToken() : null;
}

export async function refreshTokens(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  const rt = await getRefreshToken();
  if (!rt) return false;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
        cache: 'no-store',
      });

      if (!res.ok) return false;
      const data = await res.json() as { accessToken: string; refreshToken: string; };
      const accessExp = getExp(data.accessToken);
      await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken, accessExp });
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}


