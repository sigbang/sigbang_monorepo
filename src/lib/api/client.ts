import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/proxy',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Proactive refresh: validate and refresh tokens if needed
api.interceptors.request.use(async (config) => {
  try {
    // Call API route to validate and refresh tokens if needed
    // The server will handle the timing logic based on ENV.PROACTIVE_REFRESH_WINDOW_SECONDS
    await fetch('/api/auth/validate', { 
      method: 'POST',
      cache: 'no-store' 
    });
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
      
      // Handle various authentication errors
      if (status === 401 || authHeader === 'invalid') {
        console.warn('[auth] Unauthorized - redirecting to login');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (status === 403) {
        console.warn('[auth] Forbidden - insufficient permissions');
        // Could show a toast notification or modal for 403 errors
        if (typeof window !== 'undefined') {
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
          console.warn('[auth] Token format error - redirecting to login');
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
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


