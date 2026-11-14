import { ogContentType, ogSize, renderOg } from '@/lib/og';

export const size = ogSize;
export const contentType = ogContentType;
export const alt = 'Camelot key converter';

export default function Image() {
  return renderOg({ eyebrow: 'Free tool', title: 'Camelot key converter', art: { kind: 'wheel' } });
}
