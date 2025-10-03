import axios from 'axios';
import { isExpired } from '../auth/jwt';
import { ensureValidAccessToken, refreshTokens } from '../auth/refresh';

export const api = axios.create({
  baseURL: '/api/proxy',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Proactive refresh: if AT is expiring within 60s, attempt a single refresh
api.interceptors.request.use(async (config) => {
  try {
    // We do not carry AT on the client; proxy adds it from cookies.
    // But we can still trigger refresh to keep cookies fresh.
    const at = await ensureValidAccessToken();
    if (!at || isExpired(at, 60)) {
      await refreshTokens();
    }
  } catch {}
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    try {
      const status: number | undefined = error?.response?.status;
      const authHeader: string | undefined = error?.response?.headers?.['x-auth-status'];
      if (status === 401 || authHeader === 'invalid') {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } catch {}
    return Promise.reject(error);
  }
);

export function unwrap<T>(raw: unknown): T {
  if (typeof raw === 'object' && raw !== null && 'data' in raw) {
    const container = raw as { data?: unknown };
    return (container.data as T) ?? (raw as T);
  }
  return raw as T;
}


