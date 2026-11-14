import type { MetadataRoute } from 'next';
import { docsPages } from '@/components/docs/docs-index';
import { comparisons } from '@/content/compare';
import { featurePages, featurePath } from '@/content/features';
import { guides } from '@/content/guides';
import { recipes } from '@/content/recipes';
import { absoluteUrl, site } from '@/lib/site';

type Entry = MetadataRoute.Sitemap[number];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(`${site.updated}T12:00:00Z`);
  const entry = (path: string, priority: number, changeFrequency: Entry['changeFrequency'] = 'monthly'): Entry => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority,
  });

  return [
    entry('/', 1, 'weekly'),
    entry('/start', 0.8),
    ...featurePages.map((p) => entry(featurePath(p), 0.9)),
    entry('/guides/camelot-wheel', 0.9),
    entry('/guides', 0.6, 'weekly'),
    ...guides.map((g) => entry(`/guides/${g.slug}`, 0.7)),
    entry('/recipes', 0.7, 'weekly'),
    ...recipes.map((r) => entry(`/recipes/${r.slug}`, 0.6)),
    entry('/tools', 0.5),
    entry('/tools/camelot-converter', 0.8),
    entry('/tools/bpm-key-finder', 0.8),
    entry('/compare', 0.5),
    ...comparisons.map((c) => entry(`/compare/${c.slug}`, 0.7)),
    ...docsPages.map((d) => entry(d.href, 0.6)),
    entry('/open-source', 0.5),
    entry('/about', 0.5),
    entry('/changelog', 0.4, 'weekly'),
    entry('/privacy', 0.2, 'yearly'),
    entry('/terms', 0.2, 'yearly'),
  ];
}
