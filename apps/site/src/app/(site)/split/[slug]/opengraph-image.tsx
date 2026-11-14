import { getFeature } from '@/content/features';
import { ogContentType, ogSize, renderOg } from '@/lib/og';

export const size = ogSize;
export const contentType = ogContentType;
export const alt = 'AutoSort feature';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getFeature('split', slug);
  return renderOg({ eyebrow: page ? `Split ${page.label.toLowerCase()}` : 'Split a playlist', title: page?.h1 ?? 'Split a Spotify playlist', art: { kind: 'stack' } });
}
