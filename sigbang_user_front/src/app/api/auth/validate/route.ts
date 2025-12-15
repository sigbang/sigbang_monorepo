export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getAccessToken, getRefreshToken } from '@/lib/auth/cookies';
import { refreshTokens } from '@/lib/auth/refresh';
import { isExpired } from '@/lib/auth/jwt';
import { ENV } from '@/lib/env';

export async function POST() {
  try {
    console.log('[auth/validate] start');
    const at = await getAccessToken();
    const rt = await getRefreshToken();
    console.log('[auth/validate] cookies', { hasAT: !!at, hasRT: !!rt });
    
    if (!at && !rt) {
      // Treat unauthenticated as a non-error state to avoid noisy 401s
      console.log('[auth/validate] unauthenticated, no tokens');
      return NextResponse.json({ valid: false, needsRefresh: false }, { status: 200 });
    }
    
    // Check if access token is expired or will expire within proactive window
    const needsRefresh = !at || isExpired(at, ENV.PROACTIVE_REFRESH_WINDOW_SECONDS);
    console.log('[auth/validate] needsRefresh', { needsRefresh, hasRT: !!rt });
    
    if (needsRefresh && rt) {
      try {
        console.log('[auth/validate] calling refreshTokens');
        const refreshed = await refreshTokens();
        const finalAt = await getAccessToken();
        
        if (!refreshed) {
          console.log('[auth/validate] refreshTokens returned false');
          return NextResponse.json({ valid: false, needsRefresh: true }, { status: 200 });
        }
        
        console.log('[auth/validate] refreshTokens succeeded', { refreshed, hasToken: !!finalAt });
        return NextResponse.json({ 
          valid: true, 
          refreshed,
          hasToken: !!finalAt 
        });
      } catch (refreshError) {
        console.error('[auth/validate] refresh failed:', refreshError);
        return NextResponse.json({ valid: false, needsRefresh: true }, { status: 200 });
      }
    }
    
    console.log('[auth/validate] token still valid, no refresh needed', { hasAT: !!at });
    return NextResponse.json({ 
      valid: true, 
      refreshed: false,
      hasToken: !!at 
    });
  } catch (error) {
    console.error('[auth/validate] error:', error);
    return NextResponse.json({ valid: false, needsRefresh: false }, { status: 200 });
  }
}
