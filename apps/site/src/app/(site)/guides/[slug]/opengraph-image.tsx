import { getGuide } from '@/content/guides';
import { ogContentType, ogSize, renderOg } from '@/lib/og';

export const size = ogSize;
export const contentType = ogContentType;
export const alt = 'AutoSort guide';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  return renderOg({ eyebrow: 'Guide', title: g?.title ?? 'Guide', art: { kind: slug.includes('bpm') ? 'bars' : 'stack' } });
}
