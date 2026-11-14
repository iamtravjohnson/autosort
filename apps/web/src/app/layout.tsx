import type { Metadata, Viewport } from 'next';
import { Figtree, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const figtree = Figtree({ variable: '--font-figtree', subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });
const mono = JetBrains_Mono({ variable: '--font-jetbrains-mono', subsets: ['latin'], weight: ['400', '500'] });

export const metadata: Metadata = {
  title: { default: 'AutoSort', template: '%s · AutoSort' },
  description: 'Your own AutoSort: smart Spotify playlists that keep themselves organized.',
  // A private, per-family instance: keep it out of search engines.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#0B0B0C', colorScheme: 'dark' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${mono.variable}`}>
      <body className="min-h-dvh bg-bg text-text-1">{children}</body>
    </html>
  );
}
