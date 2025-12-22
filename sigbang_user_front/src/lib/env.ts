const DEFAULT_SITE_URL = 'https://sigbang.com';
const DEFAULT_API_BASE_URL = 'https://api.sigbang.com';

export const ENV = {
  // Prefer server-only envs, fall back to public ones, then defaults
  SITE_URL:
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    DEFAULT_SITE_URL,
  API_BASE_URL:
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_API_BASE_URL,
  // Increased leeway for network latency and clock skew
  ACCESS_LEEWAY_SECONDS: Number(process.env.NEXT_PUBLIC_ACCESS_LEEWAY_SECONDS ?? 60),
  // Reduced proactive refresh window for better user experience
  PROACTIVE_REFRESH_WINDOW_SECONDS: Number(process.env.NEXT_PUBLIC_PROACTIVE_REFRESH_WINDOW_SECONDS ?? 300),
  // Google Identity Services client id (for web login)
  GOOGLE_CLIENT_ID:
    process.env.GOOGLE_CLIENT_ID ??
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
    '',
  // Site verification tokens (optional)
  GOOGLE_SITE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  BING_SITE_VERIFICATION: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
  NAVER_SITE_VERIFICATION: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION,
};


