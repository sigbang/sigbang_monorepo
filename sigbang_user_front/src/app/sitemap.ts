import type { MetadataRoute } from 'next';
import { ENV } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = ENV.SITE_URL;
  const now = new Date();
  const urls = [
    '/',
    '/about',
    '/download',
    '/feed/explore',
    '/feed/popular',
    '/feed/recommended',
    '/feedback',
    '/legal/privacy',
    '/legal/terms',
  ];
  return urls.map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: p === '/' ? 1 : 0.7,
  }));
}


