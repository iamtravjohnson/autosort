import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { CompareTable } from '@/components/home/compare-table';
import { FanOutDiagram } from '@/components/home/fan-out';
import { DatabaseIcon, FamilyIcon, NoSubscriptionIcon } from '@/components/home/icons';
import { RecipeCards } from '@/components/home/recipe-cards';
import { StaticCamelotWheel } from '@/components/home/static-camelot-wheel';
import { SyncTimeline } from '@/components/home/sync-timeline';
import { GitHubIcon } from '@/components/icons';
import { Faq, JsonLd } from '@/components/seo';
import { CtaBand } from '@/components/site-chrome';
import { ButtonLink, Container, QuickAnswer, StepNumber, buttonClass } from '@/components/ui';
import { formatCount, getRepoStats } from '@/lib/github';
import { pageMetadata, softwareJsonLd, sourceCodeJsonLd, type FaqItem } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'AutoSort · Free, open-source Spotify playlist organizer',
  absoluteTitle: true,
  description:
    'Split one giant Spotify playlist into smart playlists by genre, decade, mood, BPM and key that update themselves daily. Free, open source and self-hosted.',
  path: '/',
});

/* ---------- Content ---------- */

const STEPS = [
  {
    title: 'Create your free Spotify developer app',
    body: 'About 5 minutes. You get a Client ID and Secret that only your copy of AutoSort uses.',
  },
  {
    title: 'Deploy AutoSort with one click',
    body: 'The Vercel button copies the code to your GitHub, sets up the free storage it needs, and schedules the daily sync.',
  },
  {
    title: 'Pick your playlist and accept Smart suggestions',
    body: 'AutoSort reads your playlist, proposes playlists like Country or Workout, and creates them in Spotify.',
  },
];

const WHY = [
  {
    Icon: DatabaseIcon,
    title: 'Your data stays in your own account',
    body: "Nothing goes to a central AutoSort server. There isn't one.",
  },
  {
    Icon: NoSubscriptionIcon,
    title: 'No subscription',
    body: "Every feature is free. It runs on Vercel's free plan.",
  },
  {
    Icon: FamilyIcon,
    title: 'Share it with up to 4 family members',
    body: 'Each person connects their own Spotify and gets their own smart playlists.',
  },
];

/** One tile per sort page. */
const SORTS = [
  { name: 'BPM', desc: 'Slowest to fastest, or a range.', href: '/sort/by-bpm' },
  { name: 'Key', desc: 'Group songs by musical key.', href: '/sort/by-key' },
  { name: 'Camelot · harmonic mix', desc: 'Each key mixes into the next.', href: '/sort/by-camelot' },
  { name: 'Energy', desc: 'Arcs like Warm-up → Peak.', href: '/sort/by-energy' },
  { name: 'Date added', desc: 'Oldest gems first.', href: '/sort/by-date-added' },
  { name: 'Release date', desc: 'A walk through the years.', href: '/sort/by-release-date' },
];

const COMPARISONS = [
  { label: 'vs Smart Reorder', href: '/compare/smart-reorder' },
  { label: 'vs Free Your Music', href: '/compare/free-your-music' },
  { label: 'vs Skiley', href: '/compare/skiley' },
  { label: 'vs PlaylistSorter', href: '/compare/playlistsorter' },
  { label: 'vs Sort by Tune', href: '/compare/sortbytune' },
  { label: 'Sort Your Music alternative', href: '/compare/sort-your-music-alternative' },
];

const FAQ: FaqItem[] = [
  {
    q: 'Is AutoSort really free?',
    a: "Yes. AutoSort is free and open source under the MIT license, with no subscription and no paid tier. It runs on Vercel's free plan, and the deploy sets up the small database it needs for you, so there's nothing else to sign up for. The one cost is Spotify's: whoever owns the Spotify developer app needs Spotify Premium.",
  },
  {
    q: 'Do I need Spotify Premium?',
    a: 'The owner does. Spotify requires the owner of a developer app in Development Mode to have Premium, and each copy of AutoSort runs on its own developer app. Family members you add sign in with their own Spotify accounts.',
  },
  {
    q: 'Does AutoSort change my main playlist?',
    a: 'No. AutoSort reads your source playlist and only writes to the smart playlists it creates, which appear in Spotify with names like "Country (AutoSort)". Every sync is logged, and you can undo it.',
  },
  {
    q: 'Can my family use it?',
    a: "Yes. Spotify allows up to 5 users per developer app in Development Mode, so the owner can add up to 4 family members by name and Spotify email under User Management in the Spotify Developer Dashboard. Each person connects their own Spotify account and gets their own smart playlists.",
  },
  {
    q: 'Is AutoSort made by Spotify?',
    a: `No. ${site.disclaimer} It uses the official Spotify Web API and builds playlists from transparent, editable rules, never by feeding your Spotify data to AI.`,
  },
];

/* ---------- Building blocks ---------- */

function Band({
  id,
  labelledBy,
  raised = false,
  bordered = false,
  className = '',
  children,
}: {
  id?: string;
  labelledBy: string;
  raised?: boolean;
  bordered?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`${raised ? 'bg-surface-1' : ''} ${bordered ? 'border-t border-line' : ''}`}>
      <Container className={`py-12 sm:py-[72px] ${className}`}>{children}</Container>
    </section>
  );
}

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="m-0 text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-[40px]">
      {children}
    </h2>
  );
}

function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-[15px] font-bold no-underline hover:underline">
      {children} <span aria-hidden="true">→</span>
    </Link>
  );
}

async function StarCount() {
  const { stars } = await getRepoStats();
  return <>{formatCount(stars)}</>;
}

/* ---------- Page ---------- */

export default function HomePage() {
  return (
    <>
      <JsonLd data={[softwareJsonLd(), sourceCodeJsonLd()]} />

      {/* Hero */}
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-6 pb-10 pt-9 sm:pb-14 sm:pt-[72px]">
        <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-6">
          <span className="flex items-center gap-2 self-start rounded-pill bg-surface-2 px-3 py-1.5 text-[13px] font-semibold text-text-2">
            <span className="size-2 rounded-pill bg-success" aria-hidden="true" />
            Free &amp; open source · MIT
          </span>
          <h1 className="m-0 text-[clamp(40px,5.6vw,72px)] font-extrabold leading-[1.02] tracking-[-0.035em]">
            Turn one giant Spotify playlist into perfectly organized ones
          </h1>
          <p className="m-0 max-w-[560px] text-[19px] leading-[1.55] text-text-2">
            AutoSort splits your playlist by genre, decade, mood and vibe, then keeps every playlist updated as you add songs. Free and open
            source, and it runs on your own accounts.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={site.startPath} size="lg">
              Deploy your own
            </ButtonLink>
            <a href={site.github} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary', 'lg', 'tnum gap-2.5')}>
              <GitHubIcon />
              View on GitHub <span aria-hidden="true">★</span>
              <Suspense fallback="—">
                <StarCount />
              </Suspense>
              <span className="sr-only"> stars</span>
            </a>
          </div>
          <QuickAnswer>
            AutoSort is a free, open-source app that splits one big Spotify playlist into smart playlists by genre, decade, mood, BPM and key.
            You run your own copy with your own free Spotify developer app and connect Spotify. Every day it files new songs into the right
            playlists. There&apos;s no subscription.
          </QuickAnswer>
        </div>
        <FanOutDiagram />
      </div>

      {/* How it works (target of the header's "Features" link) */}
      <Band id="how-it-works" labelledBy="how-it-works-title" bordered className="flex flex-col gap-8">
        <H2 id="how-it-works-title">How it works</H2>
        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-6 p-0">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3 rounded-card bg-surface-1 p-7">
              <StepNumber n={i + 1} size={40} />
              <h3 className="m-0 text-[20px] font-bold">{s.title}</h3>
              <p className="m-0 text-[15px] leading-[1.55] text-text-2">{s.body}</p>
            </li>
          ))}
        </ol>
      </Band>

      {/* Recipes */}
      <Band labelledBy="recipes" raised className="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <H2 id="recipes">Recipes to start from</H2>
            <p className="m-0 text-[17px] text-text-2">Ready-made smart playlists. Import one, tweak the rules, done.</p>
          </div>
          <ArrowLink href="/recipes">Browse all recipes</ArrowLink>
        </div>
        <RecipeCards />
      </Band>

      {/* It keeps itself updated */}
      <Band labelledBy="updated" className="flex flex-wrap items-center gap-12">
        <div className="flex flex-[1_1_380px] flex-col gap-4">
          <H2 id="updated">It keeps itself updated</H2>
          <p className="m-0 text-[17px] leading-[1.6] text-text-2">
            Keep adding songs to your main playlist exactly like you do now. Every morning AutoSort files the new ones into the right playlists. When a new
            group shows up, like enough Christmas songs for their own playlist, it suggests one.
          </p>
          <div>
            <ArrowLink href="/docs/how-it-works">How syncing works</ArrowLink>
          </div>
        </div>
        <SyncTimeline />
      </Band>

      {/* Why self-hosted? */}
      <Band labelledBy="self-hosted" raised className="flex flex-col gap-8">
        <H2 id="self-hosted">Why self-hosted?</H2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-6">
          {WHY.map(({ Icon, title, body }) => (
            <div key={title} className="flex flex-col gap-2.5 rounded-card bg-surface-2 p-7">
              <Icon className="text-accent-hover" />
              <h3 className="m-0 text-[20px] font-bold">{title}</h3>
              <p className="m-0 text-[15px] leading-[1.55] text-text-2">{body}</p>
            </div>
          ))}
        </div>
      </Band>

      {/* Sort any playlist */}
      <Band labelledBy="sort" className="flex flex-wrap items-center gap-12">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-6">
          <div className="flex flex-col gap-2">
            <H2 id="sort">Sort any playlist, six ways</H2>
            <p className="m-0 text-[17px] text-text-2">One-off sorting for any playlist you own. Preview it, then save it back to Spotify.</p>
          </div>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-3 p-0">
            {SORTS.map((s) => (
              <li key={s.href} className="flex">
                <Link
                  href={s.href}
                  className="flex w-full flex-col gap-1 rounded-card border border-line bg-surface-1 px-[18px] py-4 text-text-1 no-underline transition-colors duration-[120ms] hover:border-white/20 hover:text-text-1"
                >
                  <span className="text-[16px] font-bold">{s.name}</span>
                  <span className="text-[14px] text-text-2">{s.desc}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex min-w-0 flex-[1_1_360px] flex-col items-center gap-4">
          <StaticCamelotWheel selected="8A" />
          <p className="m-0 text-center text-[14px] text-text-2">
            8A and the four keys that mix with it.{' '}
            <Link href="/guides/camelot-wheel" className="font-bold">
              Open the Camelot wheel guide <span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </Band>

      {/* Compare */}
      <Band labelledBy="compare" raised className="flex flex-col gap-6">
        <H2 id="compare">How AutoSort compares</H2>
        <CompareTable />
        <p className="m-0 text-[14px] leading-[1.6] text-text-3">
          Competitor details as of November 2026. We make AutoSort, so weigh that.
        </p>
        <nav aria-label="Detailed comparisons" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px]">
          <span className="font-bold text-text-1">See detailed comparisons:</span>
          {COMPARISONS.map((c) => (
            <Link key={c.href} href={c.href} className="font-semibold no-underline hover:underline">
              {c.label}
            </Link>
          ))}
        </nav>
      </Band>

      {/* FAQ */}
      <section aria-labelledby="faq">
        <div className="mx-auto max-w-[860px] px-6 pt-12 sm:pt-[72px]">
          <Faq items={FAQ} />
        </div>
      </section>

      <CtaBand title="Give your playlist some order." body="About 15 minutes, from zero to sorted." />
    </>
  );
}
