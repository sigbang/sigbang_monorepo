export const ENV = {
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  // Increased leeway for network latency and clock skew
  ACCESS_LEEWAY_SECONDS: Number(process.env.NEXT_PUBLIC_ACCESS_LEEWAY_SECONDS ?? 30),
  // Reduced proactive refresh window for better user experience
  PROACTIVE_REFRESH_WINDOW_SECONDS: Number(process.env.NEXT_PUBLIC_PROACTIVE_REFRESH_WINDOW_SECONDS ?? 120),
};


