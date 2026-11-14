import Link from 'next/link';
import { EXAMPLE_REDIRECT_URI, LOCAL_REDIRECT_URI } from '@/components/docs/docs-index';
import {
  CodeBlock,
  CopyRow,
  DeployButton,
  DocsFaq,
  DocsNote,
  DocsPage,
  DocsPreviewNotice,
  DocsSection,
  EnvTable,
  P,
  QuickAnswer,
  Screenshot,
  Step,
  Steps,
  UL,
} from '@/components/docs/docs-ui';
import { JsonLd } from '@/components/seo';
import { howToJsonLd, pageMetadata, type FaqItem } from '@/lib/seo';
import { site } from '@/lib/site';

const PATH = '/docs/quick-start';
const TITLE = 'Quick start: run your own Spotify playlist organizer';
const DESCRIPTION =
  'Set up your own AutoSort in about 15 minutes: create a Spotify developer app, deploy to Vercel, add the Redirect URI, then connect Spotify and pick a playlist to organize.';

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

const STEPS = [
  {
    name: 'Create your Spotify developer app',
    text: 'In the Spotify Developer Dashboard, choose Create app, check only Web API, and copy the Client ID and Client Secret.',
  },
  {
    name: 'Deploy to Vercel',
    text: 'Deploy AutoSort to Vercel, paste SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET, and let Vercel create the database.',
  },
  {
    name: 'Add the Redirect URI to Spotify',
    text: 'In your Spotify app settings, add https://your-autosort.vercel.app/api/auth/callback/spotify (with your own address) under Redirect URIs and save.',
  },
  {
    name: 'Connect Spotify and pick a source',
    text: 'Open your deployment, click Connect your Spotify account to become the owner, then choose the playlist or Liked Songs to organize.',
  },
];

const FAQ: FaqItem[] = [
  {
    q: 'Who needs Spotify Premium?',
    a: 'The person who owns the Spotify developer app needs Spotify Premium, because Spotify requires it for apps in Development Mode. That owner can allow up to five users in total, including themselves, under User Management in the Spotify Developer Dashboard.',
  },
  {
    q: 'What does it cost to run AutoSort?',
    a: "AutoSort is free and open source under the MIT license. It's built to run on free accounts: a Spotify developer app, GitHub, and Vercel's free Hobby plan, which also creates the small database AutoSort needs. Spotify Premium for the app owner is the only paid requirement.",
  },
  {
    q: 'Can I run AutoSort on my own computer?',
    a: "Yes, for trying it out. Clone the repository, copy .env.example to .env.local and start the dev server. Spotify doesn't accept localhost as a redirect address, so register http://127.0.0.1:3000/api/auth/callback/spotify and open the app at 127.0.0.1. The daily sync needs a deployment that stays online, such as Vercel.",
  },
  {
    q: 'Does AutoSort use AI on my Spotify data?',
    a: "No. Spotify's Developer Policy doesn't allow Spotify data to be fed into AI models, so AutoSort builds every smart playlist from transparent rules you can read and edit.",
  },
];

const TOC = [
  { id: 'need', label: 'What you need' },
  { id: 'spotify-app', label: '1 · Spotify developer app' },
  { id: 'deploy', label: '2 · Deploy to Vercel' },
  { id: 'redirect', label: '3 · Redirect URI' },
  { id: 'connect', label: '4 · Connect Spotify' },
  { id: 'next', label: 'What happens next' },
  { id: 'faq', label: 'FAQ' },
];

export default function QuickStartPage() {
  return (
    <DocsPage path={PATH} title={TITLE} meta="15 min" toc={TOC}>
      <QuickAnswer>
        Create a free Spotify developer app and copy its Client ID and Client Secret. Deploy AutoSort to Vercel, paste both keys, and let
        Vercel create the database. Add your Redirect URI to the Spotify app, then connect your Spotify account and pick the playlist to
        organize. Plan on about 15 minutes.
      </QuickAnswer>
      <DocsPreviewNotice />

      <DocsSection id="need" title="What you need">
        <UL>
          <li>
            A Spotify account. Whoever owns the Spotify app needs Premium (see{' '}
            <Link href="/docs/spotify-app#requirements">account requirements</Link>)
          </li>
          <li>A free GitHub account</li>
          <li>A free Vercel account</li>
          <li>Nothing else: Vercel creates the small database AutoSort needs while it deploys</li>
        </UL>
      </DocsSection>

      <Steps>
        <Step n={1} id="spotify-app" title="Create your Spotify developer app">
          <P>
            Open the <a href="https://developer.spotify.com/dashboard">Spotify Developer Dashboard</a>, choose <strong>Create app</strong>, and
            name it something like “AutoSort (Family)”. When it asks which APIs you&apos;ll use, check only <strong>Web API</strong>. Copy the{' '}
            <strong>Client ID</strong> and <strong>Client Secret</strong>. You&apos;ll paste them in step 2.
          </P>
          <Screenshot
            url="developer.spotify.com/dashboard"
            label="Create app form"
            caption="The Create app form in the Spotify Developer Dashboard."
            height={260}
          />
          <DocsNote tone="info" label="Tip">
            The full walkthrough with every field is in <Link href="/docs/spotify-app">Create your Spotify developer app</Link>.
          </DocsNote>
        </Step>

        <Step n={2} id="deploy" title="Deploy to Vercel">
          <P>The button copies AutoSort to your GitHub and asks for these environment variables.</P>
          <DeployButton />
          <EnvTable />
        </Step>

        <Step n={3} id="redirect" title="Add the Redirect URI to Spotify">
          <P>
            In your Spotify app&apos;s settings, paste this under <strong>Redirect URIs</strong> and save. Swap in your own Vercel address;
            your setup page shows the exact value.
          </P>
          <CopyRow value={EXAMPLE_REDIRECT_URI} label="Redirect URI" />
          <DocsNote tone="warning" label="Warning">
            The URI must match exactly, including <code>https</code> and no trailing slash. A mismatch shows “INVALID_CLIENT: Invalid
            redirect URI”. Spotify only accepts HTTPS addresses, or <code>http://127.0.0.1</code> with a port for local development;{' '}
            <code>localhost</code> isn&apos;t allowed.
          </DocsNote>
        </Step>

        <Step n={4} id="connect" title="Connect Spotify and pick a source">
          <P>
            Open your deployment. The setup checklist confirms everything is green. Click <strong>Connect your Spotify account</strong> (you
            become the owner), then choose the playlist you always add to, or Liked Songs, as the source.
          </P>
          <CodeBlock
            title="Terminal · optional local run"
            label="local run commands"
            lines={[`git clone ${site.github}`, 'cd autosort && cp .env.example .env.local', 'pnpm install && pnpm dev']}
          />
          <P className="text-[15px]">
            Running it locally? Add <code>{LOCAL_REDIRECT_URI}</code> as a second Redirect URI and open the app at{' '}
            <code>127.0.0.1:3000</code>, not localhost.
          </P>
          <DocsNote tone="violet" label="Important">
            Family members must be added in your Spotify app&apos;s User Management before they can connect. See{' '}
            <Link href="/docs/family">Add family members</Link>.
          </DocsNote>
        </Step>
      </Steps>

      <DocsSection id="next" title="What happens next">
        <P>
          Once a day, AutoSort&apos;s sync checks your source for new songs and files each one into every smart playlist whose rules it
          matches, newest added first. Songs that match nothing wait in Unmatched, and every sync is logged with Undo. The playlists it
          creates appear in Spotify with names like “Country (AutoSort)”. Learn the details in{' '}
          <Link href="/docs/how-it-works">How smart playlists work</Link>, or start from a <Link href="/recipes">recipe</Link>.
        </P>
      </DocsSection>

      <DocsFaq items={FAQ} />

      <JsonLd data={howToJsonLd({ name: TITLE, description: DESCRIPTION, totalTime: 'PT15M', steps: STEPS })} />
    </DocsPage>
  );
}
