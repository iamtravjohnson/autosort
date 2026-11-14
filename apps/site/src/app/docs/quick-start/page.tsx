import Link from 'next/link';
import { EXAMPLE_REDIRECT_URI, LOCAL_REDIRECT_URI } from '@/components/docs/docs-index';
import {
  CodeBlock,
  CopyRow,
  DeployButton,
  DocsFaq,
  DocsNote,
  DocsPage,
  DocsEarlyReleaseNote,
  DocsSection,
  EnvTable,
  OL,
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
  'Set up your own AutoSort in about 15 minutes: create a Spotify developer app, get a free Last.fm key, deploy to Vercel, add the Redirect URI, then connect Spotify and pick a playlist to organize.';

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

const STEPS = [
  {
    name: 'Create your Spotify developer app',
    text: 'In the Spotify Developer Dashboard, choose Create app, check only Web API, and copy the Client ID and Client Secret.',
  },
  {
    name: 'Get a free Last.fm API key',
    text: 'At last.fm/api/account/create, sign in, name the app AutoSort, submit, and copy the API key.',
  },
  {
    name: 'Deploy to Vercel',
    text: 'Deploy AutoSort to Vercel, paste SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and LASTFM_API_KEY, and let Vercel create the database.',
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
  { id: 'keys', label: '2 · Last.fm key' },
  { id: 'deploy', label: '3 · Deploy to Vercel' },
  { id: 'redirect', label: '4 · Redirect URI' },
  { id: 'connect', label: '5 · Connect Spotify' },
  { id: 'next', label: 'What happens next' },
  { id: 'faq', label: 'FAQ' },
];

export default function QuickStartPage() {
  return (
    <DocsPage path={PATH} title={TITLE} meta="15 min" toc={TOC}>
      <QuickAnswer>
        Create a free Spotify developer app and copy its Client ID and Client Secret, then get a free Last.fm API key. Deploy AutoSort to
        Vercel, paste all three, and let Vercel create the database. Add your Redirect URI to the Spotify app, then connect your Spotify account and pick the playlist to
        organize. Plan on about 15 minutes.
      </QuickAnswer>
      <DocsEarlyReleaseNote />

      <DocsSection id="need" title="What you need">
        <UL>
          <li>
            A Spotify account. Whoever owns the Spotify app needs Premium (see{' '}
            <Link href="/docs/spotify-app#requirements">account requirements</Link>)
          </li>
          <li>A free GitHub account</li>
          <li>A free Vercel account</li>
          <li>A free Last.fm account, for the API key AutoSort uses to tell genres apart</li>
          <li>Nothing else: Vercel creates the small database AutoSort needs while it deploys</li>
        </UL>
      </DocsSection>

      <Steps>
        <Step n={1} id="spotify-app" title="Create your Spotify developer app">
          <P>
            Open the <a href="https://developer.spotify.com/dashboard">Spotify Developer Dashboard</a>, choose <strong>Create app</strong>, and
            name it something like “AutoSort (Family)”. When it asks which APIs you&apos;ll use, check only <strong>Web API</strong>. Copy the{' '}
            <strong>Client ID</strong> and <strong>Client Secret</strong>. You&apos;ll paste them in step 3.
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

        <Step n={2} id="keys" title="Get a free Last.fm API key">
          <P>
            Spotify no longer tells apps which genre an artist plays, so AutoSort reads Last.fm&apos;s tags for each song, album and artist
            instead. That&apos;s how it keeps a rapper&apos;s country song out of your Rap playlist. The key is free and takes about two
            minutes:
          </P>
          <OL>
            <li>
              Open <a href="https://www.last.fm/api/account/create">last.fm/api/account/create</a> and sign in (or create a free Last.fm
              account).
            </li>
            <li>
              Fill in your email, an application name like <strong>AutoSort</strong> and a short description like{' '}
              <strong>Organizes my Spotify playlists</strong>. Leave the callback URL and homepage empty.
            </li>
            <li>
              Click <strong>Submit</strong> and copy the <strong>API key</strong>. You don&apos;t need the shared secret.
            </li>
          </OL>
        </Step>

        <Step n={3} id="deploy" title="Deploy to Vercel">
          <P>The button copies AutoSort to your GitHub, creates its database and asks for your three keys.</P>
          <DeployButton />
          <P>Vercel walks you through a few screens. Here&apos;s what to pick:</P>
          <OL>
            <li>
              <strong>Sign in to Vercel</strong> with GitHub. A free Hobby account is all you need.
            </li>
            <li>
              <strong>Create the GitHub repository.</strong> Keep your own GitHub account and the suggested name. If you already have a
              repository or Vercel project called <code>autosort</code>, use another name, like <code>autosort-family</code>. Keep it
              private.
            </li>
            <li>
              <strong>Add the Neon database.</strong> Region: keep <strong>Washington, D.C., USA (East)</strong>, where Vercel runs your
              app by default. <strong>Auth:</strong> turn it off, since AutoSort signs people in with Spotify. <strong>Realtime:</strong>{' '}
              leave it off. Plan: <strong>Free</strong>. If it asks for an environment variable prefix, leave it blank.
            </li>
            <li>
              <strong>Paste your keys</strong> into <code>SPOTIFY_CLIENT_ID</code>, <code>SPOTIFY_CLIENT_SECRET</code> and{' '}
              <code>LASTFM_API_KEY</code>, then click <strong>Deploy</strong>. It takes about two minutes.
            </li>
          </OL>
          <P>The environment variables, for reference:</P>
          <EnvTable />
        </Step>

        <Step n={4} id="redirect" title="Add the Redirect URI to Spotify">
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

        <Step n={5} id="connect" title="Connect Spotify and pick a source">
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
