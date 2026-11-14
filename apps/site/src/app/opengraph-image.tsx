import { ogContentType, ogSize, renderOg } from '@/lib/og';

export const alt = 'AutoSort: one giant Spotify playlist, perfectly organized';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({ eyebrow: 'Spotify playlist organizer', title: 'One giant playlist, perfectly organized', art: { kind: 'stack' }, glow: true });
}
