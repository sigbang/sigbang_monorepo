export function parseJwt<T = any>(token: string): T | null {
  try {
    const payload = token.split('.')[1];
    // Base64url decode without using Node Buffer (Edge-safe)
    let normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const pad = normalized.length % 4 ? 4 - (normalized.length % 4) : 0;
    if (pad) normalized = normalized + '='.repeat(pad);
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getExp(token?: string): number | null {
  if (!token) return null;
  const payload = parseJwt<{ exp?: number | string }>(token);
  if (!payload?.exp) return null;
  return typeof payload.exp === 'string' ? Number(payload.exp) : payload.exp;
}

export function isExpired(token?: string, leewaySeconds = 15): boolean {
  const exp = getExp(token);
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return now >= (exp - leewaySeconds);
}


