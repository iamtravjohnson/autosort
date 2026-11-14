import { ogContentType, ogSize, renderOg } from '@/lib/og';

export const size = ogSize;
export const contentType = ogContentType;
export const alt = 'AutoSort docs';

export default function Image() {
  return renderOg({ eyebrow: 'Docs', title: 'Run your own Spotify playlist organizer', art: { kind: 'docs' } });
}
