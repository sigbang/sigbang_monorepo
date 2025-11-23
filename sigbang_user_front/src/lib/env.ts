export const ENV = {
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sigbang.com',
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.sigbang.com',
  // Increased leeway for network latency and clock skew
  ACCESS_LEEWAY_SECONDS: Number(process.env.NEXT_PUBLIC_ACCESS_LEEWAY_SECONDS ?? 30),
  // Reduced proactive refresh window for better user experience
  PROACTIVE_REFRESH_WINDOW_SECONDS: Number(process.env.NEXT_PUBLIC_PROACTIVE_REFRESH_WINDOW_SECONDS ?? 120),
  // Site verification tokens (optional)
  GOOGLE_SITE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  BING_SITE_VERIFICATION: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
  NAVER_SITE_VERIFICATION: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION,
};


