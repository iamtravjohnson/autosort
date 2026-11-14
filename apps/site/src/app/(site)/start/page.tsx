import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronDownIcon, VercelIcon } from '@/components/icons';
import { Breadcrumbs, JsonLd } from '@/components/seo';
import { ButtonLink, EarlyReleaseNote, QuickAnswer, StepNumber } from '@/components/ui';
import { howToJsonLd, pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

const PATH = '/start';
const QUICK_ANSWER =
  'You need Spotify Premium for the app owner, plus free GitHub and Vercel accounts. Create a Spotify developer app, get a free Last.fm key, deploy AutoSort to Vercel, paste three keys and connect Spotify. It takes about 15 minutes, and AutoSort itself costs nothing. Your copy runs on your own accounts, so your data stays yours.';

export const metadata: Metadata = pageMetadata({
  title: 'Deploy your own Spotify playlist organizer',
  description:
    'Set up your own free, open-source AutoSort in about 15 minutes: create a Spotify developer app, deploy to Vercel, connect Spotify and pick a playlist to organize.',
  path: PATH,
});

/* ---------- Content ---------- */

const FREE = { tag: 'Free', className: 'bg-success/[0.14] text-success-text' };

const NEEDS = [
  {
    title: 'Spotify account',
    body: 'The one whose playlists you want to organize. Spotify requires Premium for the developer app owner.',
    tag: 'Premium for the owner',
    className: 'bg-warning/[0.14] text-warning-text',
  },
  { title: 'GitHub account', body: 'Holds your copy of the code.', ...FREE },
  { title: 'Vercel account', body: 'Runs the app and the daily sync.', ...FREE },
  { title: 'Last.fm account', body: 'For the API key AutoSort uses to tell genres apart.', ...FREE },
  { title: 'Storage', body: 'Nothing to sign up for: Vercel creates it during deploy.', ...FREE },
];

const STEPS = [
  {
    title: 'Get your keys',
    body: 'A Spotify developer app (Client ID and Secret) and a free Last.fm API key.',
    time: '~7 min',
    href: '/docs/quick-start#spotify-app',
    howTo: 'In the Spotify Developer Dashboard, create an app and copy its Client ID and Client Secret (the app owner needs Spotify Premium). Then get a free API key at last.fm/api/account/create.',
  },
  {
    title: 'Deploy AutoSort to Vercel',
    body: 'Paste all three keys. Vercel sets up the database and schedule.',
    time: '~5 min',
    href: '/docs/quick-start',
    howTo: 'Deploy your own copy of AutoSort to Vercel and paste the three keys. Vercel sets up the database and the daily sync schedule.',
  },
  {
    title: 'Connect Spotify and pick your playlist',
    body: 'Accept Smart suggestions and your playlists appear in Spotify.',
    time: '~5 min',
    href: '/docs/how-it-works',
    howTo: 'Sign in with Spotify, pick the playlist to organize, and accept Smart suggestions. Your new playlists appear in Spotify.',
  },
];

const BEFORE: Array<{ q: string; a: ReactNode }> = [
  {
    q: 'Do I need to know how to code?',
    a: "No. You'll copy and paste three values and click a few buttons. The docs walk through every screen.",
  },
  {
    q: 'What does it cost to run?',
    a: (
      <>
        AutoSort is free, with no subscription. A family-sized setup is built to fit Vercel&apos;s free plan, including the small database it
        creates for you. The only paid requirement is Spotify&apos;s: the owner of the Spotify developer app needs Premium.
      </>
    ),
  },
  {
    q: 'How do I get updates?',
    a: (
      <>
        Your copy lives in your own GitHub repository. When a new version is out, click Update now in your AutoSort&apos;s Settings and
        Vercel redeploys it. The first time, you add the update action with one click. See{' '}
        <Link href="/docs/updating">Updating your AutoSort</Link> and the <Link href="/changelog">changelog</Link>.
      </>
    ),
  },
];

/* ---------- Page ---------- */

function H2({ id, children, className = '' }: { id: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} className={`m-0 text-[26px] font-extrabold leading-[1.15] tracking-[-0.03em] sm:text-[32px] ${className}`}>
      {children}
    </h2>
  );
}

export default function StartPage() {
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-9 px-6 pb-10 pt-6 sm:pb-16 sm:pt-8">
      <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'Get started' }]} path={PATH} />
      <JsonLd
        data={howToJsonLd({
          name: 'Deploy your own AutoSort Spotify playlist organizer',
          description: QUICK_ANSWER,
          totalTime: 'PT15M',
          steps: STEPS.map((s) => ({ name: s.title, text: s.howTo })),
        })}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-10">
          <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-[18px]">
            <h1 className="m-0 text-[clamp(38px,5vw,60px)] font-extrabold leading-[1.04] tracking-[-0.035em]">
              Deploy your own Spotify playlist organizer
            </h1>
            <QuickAnswer>{QUICK_ANSWER}</QuickAnswer>
          </div>
          <div className="tnum flex min-w-0 flex-[0_1_300px] flex-col items-start gap-3.5 rounded-panel bg-surface-2 p-6">
            <span className="text-[13px] text-text-2">Total time</span>
            <span className="text-[48px] font-extrabold leading-none tracking-[-0.03em]">~15 min</span>
            <ButtonLink href={site.deployUrl} variant="white" size="lg" className="!px-6" aria-describedby="deploy-note">
              <VercelIcon />
              Deploy to Vercel
            </ButtonLink>
            <span id="deploy-note" className="text-[13px] leading-[1.45] text-text-3">
              Opens Vercel. Have your Spotify Client ID and Client Secret ready.
            </span>
            <Link href="/docs/quick-start" className="text-[14px] font-bold">
              Read the quick start first <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <EarlyReleaseNote />
      </div>

      <section aria-labelledby="h-need" className="flex flex-col gap-4">
        <H2 id="h-need">What you need</H2>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4 p-0">
          {NEEDS.map((n) => (
            <li key={n.title} className="flex flex-col gap-2 rounded-card bg-surface-1 p-5">
              <span className="text-[17px] font-bold">{n.title}</span>
              <span className="text-[14px] leading-[1.5] text-text-2">{n.body}</span>
              <span className={`self-start rounded-pill px-[9px] py-[3px] text-[12px] font-bold ${n.className}`}>{n.tag}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="h-steps" className="flex flex-col gap-4">
        <H2 id="h-steps">Three steps</H2>
        <ol className="tnum m-0 flex list-none flex-col gap-3 p-0">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-wrap items-center gap-[18px] rounded-card bg-surface-1 p-5">
              <StepNumber n={i + 1} size={44} />
              <span className="flex flex-[1_1_320px] flex-col gap-0.5">
                <span className="text-[18px] font-bold">{s.title}</span>
                <span className="text-[14px] text-text-2">{s.body}</span>
              </span>
              <span className="text-[14px] font-bold text-text-2">{s.time}</span>
              <Link href={s.href} className="text-[14px] font-bold">
                Docs<span className="sr-only">: {s.title}</span> <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="h-before" className="flex flex-col">
        <H2 id="h-before" className="mb-2.5">
          Before you start
        </H2>
        {BEFORE.map((item, i) => (
          <details key={item.q} open={i === 0} className="border-t border-line py-4">
            <summary className="flex items-center justify-between gap-4 text-[17px] font-bold">
              {item.q}
              <ChevronDownIcon className="faq-chevron shrink-0 text-text-3 transition-transform duration-200" />
            </summary>
            <p className="m-0 mt-2.5 text-[16px] leading-[1.6] text-text-2">{item.a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
