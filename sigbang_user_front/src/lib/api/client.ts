import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/proxy',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Proactive refresh: validate and refresh tokens if needed (debounced)
let __lastValidateCallAt = 0;
api.interceptors.request.use(async (config) => {
  try {
    const now = Date.now();
    if (now - __lastValidateCallAt > 60_000) {
      __lastValidateCallAt = now;
      await fetch('/api/auth/validate', {
        method: 'POST',
        cache: 'no-store',
      }).catch(() => {});
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
      const data: unknown = error?.response?.data;
      const suppress = ((): boolean => {
        try { return typeof window !== 'undefined' && window.sessionStorage.getItem('suppress-login-modal') === '1'; } catch { return false; }
      })();
      
      // Handle various authentication errors
      if ((status === 401 || authHeader === 'invalid')) {
        console.warn('[auth] Unauthorized - prompting login');
        if (typeof window !== 'undefined' && !suppress) {
          window.dispatchEvent(new Event('open-login-modal'));
        }
      } else if (status === 403) {
        console.warn('[auth] Forbidden - insufficient permissions');
        // Could show a toast notification or modal for 403 errors
        if (typeof window !== 'undefined' && !suppress) {
          const message = (data && typeof data === 'object' && 'message' in data) 
            ? String(data.message) 
            : 'Insufficient permissions';
          // Dispatch custom event for UI to handle
          window.dispatchEvent(new CustomEvent('auth-error', { 
            detail: { type: 'forbidden', message }
          }));
        }
      } else if (status === 422 || status === 400) {
        // Token format or validation errors
        const errorMessage = (data && typeof data === 'object' && 'message' in data) 
          ? String(data.message) 
          : 'Authentication token error';
        if (errorMessage.toLowerCase().includes('token') || errorMessage.toLowerCase().includes('jwt')) {
          console.warn('[auth] Token format error - prompting login');
          if (typeof window !== 'undefined' && !suppress) {
            window.dispatchEvent(new Event('open-login-modal'));
          }
        }
      }
    } catch (err) {
      console.error('[auth] Error handling response:', err);
    }
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


