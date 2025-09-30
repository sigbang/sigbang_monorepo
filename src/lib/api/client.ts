import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/proxy',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export function unwrap<T>(raw: unknown): T {
  if (typeof raw === 'object' && raw !== null && 'data' in raw) {
    const container = raw as { data?: unknown };
    return (container.data as T) ?? (raw as T);
  }
  return raw as T;
}


