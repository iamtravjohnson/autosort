import type { Metadata } from 'next';
import { ReleaseEntry } from '@/components/pages/changelog';
import { Breadcrumbs } from '@/components/seo';
import { ButtonLink, QuickAnswer, buttonClass } from '@/components/ui';
import { releases } from '@/content/changelog';
import { pageMetadata } from '@/lib/seo';

const base = pageMetadata({
  title: 'Changelog',
  description:
    'Every AutoSort release: the self-hosted app, the @autosort/core engine on npm and the autosort.app website. New features, improvements and fixes, newest first.',
  path: '/changelog',
});

export const metadata: Metadata = {
  ...base,
  alternates: { ...base.alternates, types: { 'application/rss+xml': [{ url: '/changelog/rss.xml', title: 'AutoSort changelog' }] } },
};

export default function ChangelogPage() {
  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-8 px-4 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
      <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'Changelog' }]} path="/changelog" />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="m-0 text-[clamp(38px,5vw,56px)] font-extrabold leading-[1.04] tracking-[-0.035em]">Changelog</h1>
        <div className="flex gap-2.5">
          <ButtonLink href="/docs/updating" variant="secondary" size="sm" className="!px-4">
            How to update
          </ButtonLink>
          <a href="/changelog/rss.xml" type="application/rss+xml" className={buttonClass('sponsor', 'sm', '!px-4')}>
            RSS
          </a>
        </div>
      </div>

      <QuickAnswer>
        AutoSort&apos;s latest releases are the self-hosted app v0.4.1 (November 19, 2026) and engine v0.3.2 (@autosort/core on npm,
        November 14, 2026). Recent versions added Autopilot, which creates recommended playlists for you, asking for a playlist in your own words, album
        mosaic covers and a genre analyzer measured on Billboard charts. The app first shipped as v0.1.0, an early release with one-click
        Deploy to Vercel.
      </QuickAnswer>

      <ol className="m-0 flex list-none flex-col p-0">
        {releases.map((r) => (
          <ReleaseEntry key={r.id} r={r} />
        ))}
      </ol>
    </div>
  );
}
