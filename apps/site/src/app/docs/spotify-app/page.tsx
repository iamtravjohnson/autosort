import Link from 'next/link';
import { EXAMPLE_REDIRECT_URI, LOCAL_REDIRECT_URI } from '@/components/docs/docs-index';
import {
  CopyRow,
  DocsNote,
  DocsPage,
  DocsEarlyReleaseNote,
  DocsSection,
  DocsTable,
  ENV_VARS,
  EnvTable,
  P,
  QuickAnswer,
  Screenshot,
  Step,
  Steps,
  UL,
} from '@/components/docs/docs-ui';
import { JsonLd } from '@/components/seo';
import { howToJsonLd, pageMetadata } from '@/lib/seo';

const PATH = '/docs/spotify-app';
const TITLE = 'Create your Spotify developer app';
const DESCRIPTION =
  'Create the free Spotify developer app your AutoSort needs: what to type in the Create app form, which API to check, Redirect URI rules, and where to copy the Client ID and Secret.';

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

const STEPS = [
  {
    name: 'Sign in to the Developer Dashboard',
    text: 'Go to developer.spotify.com/dashboard and log in with the Spotify Premium account that will own this AutoSort.',
  },
  {
    name: 'Create an app',
    text: 'Click Create app, enter a name, a description and your Redirect URI, check only Web API, accept the terms and save.',
  },
  {
    name: 'Copy the Client ID and Secret',
    text: 'Open the app, go to Settings, copy the Client ID, then click View client secret and copy the Secret.',
  },
  {
    name: 'Paste them into Vercel',
    text: 'Use them as SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET when you deploy, or add them under Settings → Environment Variables and redeploy.',
  },
];

const TOC = [
  { id: 'requirements', label: 'Account requirements' },
  { id: 's1', label: '1 · Sign in' },
  { id: 's2', label: '2 · Create app' },
  { id: 's3', label: '3 · Copy keys' },
  { id: 's4', label: '4 · Paste into Vercel' },
  { id: 'fields', label: 'Form fields' },
];

export default function SpotifyAppPage() {
  return (
    <DocsPage path={PATH} title={TITLE} meta="about 5 minutes" toc={TOC}>
      <QuickAnswer>
        Sign in at developer.spotify.com/dashboard, click Create app, and enter a name, a description and your AutoSort Redirect URI. Check
        only Web API, accept the terms, and save. Then copy the Client ID and Client Secret from the app&apos;s Settings. The Spotify account
        that owns the app needs Premium.
      </QuickAnswer>
      <DocsEarlyReleaseNote />

      <DocsSection id="requirements" title="Account requirements">
        <UL>
          <li>
            The Spotify account that creates the app is its owner and needs <strong>Spotify Premium</strong>.
          </li>
          <li>
            New apps run in <strong>Development Mode</strong>, which allows up to <strong>5 users</strong> per app, including the owner.
          </li>
          <li>
            Everyone else is added by name and Spotify email under <strong>User Management</strong> (see{' '}
            <Link href="/docs/family">Add family members</Link>). Anyone who isn&apos;t added gets an HTTP 403 error when they connect.
          </li>
        </UL>
      </DocsSection>

      <Steps>
        <Step n={1} id="s1" title="Sign in to the Developer Dashboard">
          <P>
            Go to <a href="https://developer.spotify.com/dashboard">developer.spotify.com/dashboard</a> and log in with the Spotify account
            that will own this AutoSort. If it&apos;s your first app, Spotify may ask you to accept its Developer Terms and verify your email
            first.
          </P>
          <Screenshot url="developer.spotify.com/dashboard" label="Developer Dashboard home" height={200} />
        </Step>

        <Step n={2} id="s2" title="Create an app">
          <P>
            Click <strong>Create app</strong> and fill in the form using <a href="#fields">the table below</a>. Check only{' '}
            <strong>Web API</strong>. If you haven&apos;t deployed yet, enter the Vercel address you plan to use (or the 127.0.0.1 address for
            local testing) as the Redirect URI. You can change it any time in the app&apos;s Settings.
          </P>
          <Screenshot url="developer.spotify.com/dashboard" label="Create app form" height={200} />
        </Step>

        <Step n={3} id="s3" title="Copy the Client ID and Secret">
          <P>
            Open the app and go to <strong>Settings</strong>. Copy the <strong>Client ID</strong>, then click{' '}
            <strong>View client secret</strong> and copy the Secret. Treat the Secret like a password: don&apos;t share it or commit it to
            GitHub.
          </P>
          <Screenshot label="App settings, basic information" height={200} />
        </Step>

        <Step n={4} id="s4" title="Paste them into Vercel">
          <P>
            Use them as <code>SPOTIFY_CLIENT_ID</code> and <code>SPOTIFY_CLIENT_SECRET</code> when you click Deploy to Vercel (see the{' '}
            <Link href="/docs/quick-start#deploy">quick start</Link>). Already deployed? Add them in your Vercel project under{' '}
            <strong>Settings → Environment Variables</strong>, then redeploy.
          </P>
          <EnvTable vars={ENV_VARS.filter((v) => v.req === 'Required')} />
          <Screenshot url="vercel.com" label="Vercel environment variables" height={200} />
        </Step>
      </Steps>

      <DocsSection id="fields" title="What to type in the Create app form" size="md">
        <DocsTable
          head={['Field', 'Enter']}
          rows={[
            ['App name', 'AutoSort (Family), or anything you like'],
            ['App description', 'Personal playlist organizer'],
            [
              'Redirect URIs',
              <>
                <code className="break-all">{EXAMPLE_REDIRECT_URI}</code>, using your own Vercel address
              </>,
            ],
            ['APIs used', 'Web API only'],
            ['Terms', 'Read and accept Spotify’s Developer Terms of Service'],
          ]}
        />
        <CopyRow value={EXAMPLE_REDIRECT_URI} label="Redirect URI" />
        <DocsNote tone="warning" label="Redirect URI rules">
          Spotify only accepts HTTPS addresses, or a loopback address such as <code>{LOCAL_REDIRECT_URI}</code> for local development.{' '}
          <code>localhost</code> isn&apos;t allowed. The value must match your deployment exactly, or sign-in fails with
          “INVALID_CLIENT: Invalid redirect URI”.
        </DocsNote>
      </DocsSection>

      <JsonLd data={howToJsonLd({ name: TITLE, description: DESCRIPTION, totalTime: 'PT5M', steps: STEPS })} />
    </DocsPage>
  );
}
