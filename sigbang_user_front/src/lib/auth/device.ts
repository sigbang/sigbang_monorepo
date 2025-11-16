'use client';

const STORAGE_KEY = 'sb_device_id';
const COOKIE_NAME = 'sb_did';
const ONE_YEAR = 60 * 60 * 24 * 365;

function generateUuidV4(): string {
  // RFC4122 v4 compliant enough for client use
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cryptoObj: any = (globalThis as any).crypto || (globalThis as any).msCrypto;
  const bytes: Uint8Array = cryptoObj?.getRandomValues ? cryptoObj.getRandomValues(new Uint8Array(16)) : new Uint8Array(16);
  if (!cryptoObj?.getRandomValues) {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  const segments = [
    Array.from(bytes.slice(0, 4)).map(toHex).join(''),
    Array.from(bytes.slice(4, 6)).map(toHex).join(''),
    Array.from(bytes.slice(6, 8)).map(toHex).join(''),
    Array.from(bytes.slice(8, 10)).map(toHex).join(''),
    Array.from(bytes.slice(10)).map(toHex).join(''),
  ];
  return segments.join('-');
}

export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = generateUuidV4();
    localStorage.setItem(STORAGE_KEY, id);
    // also set cookie for server-side refresh to read
    document.cookie = `${COOKIE_NAME}=${id}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`;
    return id;
  } catch {
    // fallback to in-memory value per session
    const id = generateUuidV4();
    try { document.cookie = `${COOKIE_NAME}=${id}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`; } catch {}
    return id;
  }
}

export function ensureDeviceCookie() {
  try {
    const id = getOrCreateDeviceId();
    document.cookie = `${COOKIE_NAME}=${id}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`;
  } catch {}
}

export function getDeviceName(): string | undefined {
  try {
    const ua = navigator.userAgent;
    const plat = (navigator as unknown as { platform?: string }).platform || '';
    return `${plat} ${ua}`.trim().slice(0, 120);
  } catch {
    return undefined;
  }
}


