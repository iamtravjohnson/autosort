import { ogContentType, ogSize, renderOg } from '@/lib/og';

export const size = ogSize;
export const contentType = ogContentType;
export const alt = 'The Camelot wheel, explained';

export default function Image() {
  return renderOg({ eyebrow: 'Guide', title: 'The Camelot wheel, explained', art: { kind: 'wheel' } });
}
