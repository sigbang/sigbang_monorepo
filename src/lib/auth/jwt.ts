export function parseJwt<T = any>(token: string): T | null {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(normalized, 'base64').toString('utf8');
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


