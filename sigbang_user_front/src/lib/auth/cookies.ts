import { cookies } from 'next/headers';

const ACCESS_COOKIE = 'sb_at';
const REFRESH_COOKIE = 'sb_rt';

export async function getAccessToken() {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshToken() {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value ?? null;
}

export async function setTokens({
  accessToken,
  refreshToken,
  accessExp,
}: { accessToken: string; refreshToken: string; accessExp?: number | null; }) {
  const jar = await cookies();
  const common = { secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };

  jar.set(REFRESH_COOKIE, refreshToken, {
    ...common,
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
  });

  const atOpts: Parameters<typeof jar.set>[2] = {
    ...common,
    httpOnly: true,
  };
  if (accessExp && accessExp > 0) {
    atOpts.expires = new Date(accessExp * 1000);
  } else {
    atOpts.maxAge = 60 * 60;
  }

  jar.set(ACCESS_COOKIE, accessToken, atOpts);
}

export async function clearTokens() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}


