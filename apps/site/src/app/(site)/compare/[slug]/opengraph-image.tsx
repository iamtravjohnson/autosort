import { getComparison } from '@/content/compare';
import { ogContentType, ogSize, renderOg } from '@/lib/og';

export const size = ogSize;
export const contentType = ogContentType;
export const alt = 'AutoSort comparison';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getComparison(slug);
  return renderOg({ eyebrow: 'Compare', title: c?.h1 ?? 'Compare', art: { kind: 'compare', other: c?.shortName ?? '?' } });
}
