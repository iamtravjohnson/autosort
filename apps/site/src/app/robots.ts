import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

/** Open to search engines and AI crawlers alike: being cited by answer engines is a goal. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
