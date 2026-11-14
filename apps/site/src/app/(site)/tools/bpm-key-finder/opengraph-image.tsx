import { ogContentType, ogSize, renderOg } from '@/lib/og';

export const size = ogSize;
export const contentType = ogContentType;
export const alt = 'Spotify BPM and key finder';

export default function Image() {
  return renderOg({ eyebrow: 'Free tool', title: 'Spotify BPM and key finder', art: { kind: 'bars' } });
}
