import { getFeature } from '@/content/features';
import { ogContentType, ogSize, renderOg } from '@/lib/og';

export const size = ogSize;
export const contentType = ogContentType;
export const alt = 'AutoSort feature';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getFeature('sort', slug);
  const keyish = slug === 'by-key' || slug === 'by-camelot';
  return renderOg({ eyebrow: page ? `Sort ${page.label.toLowerCase()}` : 'Sort a playlist', title: page?.h1 ?? 'Sort a Spotify playlist', art: { kind: keyish ? 'wheel' : 'bars' } });
}
