import { NextResponse } from 'next/server';
import { getAccessToken, getRefreshToken } from '@/lib/auth/cookies';
import { refreshTokens } from '@/lib/auth/refresh';
import { isExpired } from '@/lib/auth/jwt';
import { ENV } from '@/lib/env';

export async function POST() {
  try {
    const at = await getAccessToken();
    const rt = await getRefreshToken();
    
    if (!at && !rt) {
      return NextResponse.json({ 
        valid: false, 
        needsRefresh: false,
        error: 'no_tokens' 
      }, { status: 401 });
    }
    
    // Check if access token is expired or will expire within proactive window
    const needsRefresh = !at || isExpired(at, ENV.PROACTIVE_REFRESH_WINDOW_SECONDS);
    
    if (needsRefresh && rt) {
      try {
        const refreshed = await refreshTokens();
        const finalAt = await getAccessToken();
        
        if (!refreshed) {
          return NextResponse.json({ 
            valid: false, 
            needsRefresh: true,
            error: 'refresh_failed' 
          }, { status: 401 });
        }
        
        return NextResponse.json({ 
          valid: true, 
          refreshed,
          hasToken: !!finalAt 
        });
      } catch (refreshError) {
        console.error('[auth/validate] refresh failed:', refreshError);
        return NextResponse.json({ 
          valid: false, 
          needsRefresh: true,
          error: 'refresh_error' 
        }, { status: 401 });
      }
    }
    
    return NextResponse.json({ 
      valid: true, 
      refreshed: false,
      hasToken: !!at 
    });
  } catch (error) {
    console.error('[auth/validate] error:', error);
    return NextResponse.json({ 
      valid: false, 
      needsRefresh: false,
      error: 'validation_error' 
    }, { status: 500 });
  }
}
