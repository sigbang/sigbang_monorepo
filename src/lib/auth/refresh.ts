'use server';

import { ENV } from '@/lib/env';
import { getAccessToken, getRefreshToken, setTokens } from './cookies';
import { getExp } from './jwt';
import { cookies } from 'next/headers';

let refreshPromise: Promise<boolean> | null = null;
const DEBUG = process.env.NODE_ENV !== 'production';

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
      const endpoint = `${ENV.API_BASE_URL}/auth/refresh`;
      // Read optional device identifier from cookie set on the client
      const did = (await cookies()).get('sb_did')?.value;
      const payload = { refreshToken: rt, ...(did ? { deviceId: did } : {}) } as const;
      if (DEBUG) {
        console.log('[auth] refreshing tokens', {
          endpoint,
          rtLen: rt?.length ?? 0,
          deviceId: (payload as { deviceId?: string }).deviceId,
        });
      }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        if (DEBUG) console.error('[auth] refresh failed', { status: res.status, body: text?.slice(0, 400) });
        return false;
      }
      let raw: unknown = null;
      try { raw = await res.json(); } catch {}
      const toObj = (v: unknown): Record<string, unknown> => (typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {});
      const r = toObj(raw);
      const tokensObj = toObj(r.tokens ?? toObj(toObj(r.data).tokens));
      const accessCandidate = (tokensObj.accessToken ?? r.accessToken) as string | undefined;
      const refreshCandidate = (tokensObj.refreshToken ?? r.refreshToken) as string | undefined;
      if (!accessCandidate || !refreshCandidate) {
        if (DEBUG) console.error('[auth] refresh ok but missing tokens', { raw: JSON.stringify(raw)?.slice(0, 400) });
        return false;
      }
      const accessExp = getExp(accessCandidate);
      await setTokens({ accessToken: accessCandidate, refreshToken: refreshCandidate, accessExp });
      if (DEBUG) console.log('[auth] refresh succeeded', { hasAT: !!accessCandidate, hasRT: !!refreshCandidate, exp: accessExp });
      return true;
    } catch {
      if (DEBUG) console.error('[auth] refresh threw error');
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}


