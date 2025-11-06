import type { MetadataRoute } from 'next';
import { ENV } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/login',
          '/recipes/new',
          '/recipes/edit',
          '/recipes/import',
          '/account/delete',
          '/api/',
          '/@modal/',
          '/search',
        ],
      },
    ],
    sitemap: [`${ENV.SITE_URL}/sitemap.xml`, `${ENV.SITE_URL}/recipes/sitemap.xml`],
    host: ENV.SITE_URL,
  };
}


