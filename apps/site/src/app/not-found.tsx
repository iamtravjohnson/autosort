import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { ButtonLink } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Page not found',
  description: "This page isn't here. Head home, open the docs, or browse smart playlist recipes.",
  robots: { index: false, follow: true },
};

/** Equalizer bars with one knocked over: "skipped a beat". */
const BARS = [
  { h: 40, bg: '#26262A' },
  { h: 80, bg: '#3A3A40' },
  { h: 120, bg: '#8B5CF6' },
  { h: 20, bg: '#26262A', fallen: true },
  { h: 70, bg: '#3A3A40' },
];

const POPULAR = [
  { label: 'Camelot wheel', href: '/guides/camelot-wheel' },
  { label: 'Sort by BPM', href: '/sort/by-bpm' },
  { label: 'Split by genre', href: '/split/by-genre' },
  { label: 'Guides', href: '/guides' },
];

export default function NotFound() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-pill focus:bg-white focus:px-4 focus:py-2 focus:text-bg"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto flex max-w-[900px] flex-col items-center gap-6 px-6 py-14 text-center sm:py-24">
          <div aria-hidden="true" className="flex h-[120px] items-end gap-2">
            {BARS.map((b, i) => (
              <span
                key={i}
                className="block w-[18px] rounded-art"
                style={{ height: b.h, background: b.bg, transform: b.fallen ? 'rotate(-30deg) translateY(-6px)' : undefined }}
              />
            ))}
          </div>
          <h1 className="m-0 text-[clamp(40px,6vw,72px)] font-extrabold leading-none tracking-[-0.04em]">This page skipped a beat</h1>
          <p className="m-0 max-w-[520px] text-[18px] leading-[1.6] text-text-2">
            The page you&apos;re looking for isn&apos;t here. It may have moved, or the link has a typo.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <ButtonLink href="/">Go home</ButtonLink>
            <ButtonLink href="/docs/quick-start" variant="secondary">
              Docs
            </ButtonLink>
            <ButtonLink href="/recipes" variant="secondary">
              Recipes
            </ButtonLink>
          </div>
          <nav aria-label="Popular pages" className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[14px] text-text-3">
            <span>Popular:</span>
            {POPULAR.map((p) => (
              <Link key={p.href} href={p.href} className="font-semibold no-underline hover:underline">
                {p.label}
              </Link>
            ))}
          </nav>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
