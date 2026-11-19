import Link from 'next/link';
import { EXAMPLE_REDIRECT_URI, LOCAL_REDIRECT_URI } from '@/components/docs/docs-index';
import { CopyRow, DocsNote, DocsPage, ErrorSection, OL, P, QuickAnswer } from '@/components/docs/docs-ui';
import { pageMetadata } from '@/lib/seo';

const PATH = '/docs/troubleshooting';
const TITLE = 'Troubleshooting AutoSort';
const DESCRIPTION =
  'Fix common AutoSort errors: Spotify 403 “User not registered”, INVALID_CLIENT invalid redirect URI, a daily sync that didn’t run, 429 rate limits, and playlists that show as public.';

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

const TOC = [
  { id: 'e403', label: '403 · not registered' },
  { id: 'redirect', label: 'Invalid redirect URI' },
  { id: 'sync', label: 'Daily sync didn’t run' },
  { id: 'rate', label: '429 · slow down' },
  { id: 'public', label: 'Public playlists' },
];

export default function TroubleshootingPage() {
  return (
    <DocsPage path={PATH} title={TITLE} meta="4 min" toc={TOC}>
      <QuickAnswer>
        Most problems come from three things: a person missing from your Spotify app&apos;s User Management (HTTP 403), a Redirect URI that
        doesn&apos;t match exactly (INVALID_CLIENT), or a daily sync that was never scheduled. Find your error below; each one has the cause
        and the fix.
      </QuickAnswer>

      <ErrorSection id="e403" code="403 · User not registered in the Developer Dashboard" title="“You’re not on this AutoSort’s Spotify user list”">
        <P>
          <strong>Cause:</strong> While your Spotify app is in Development Mode, only people listed in its User Management can sign in, up to
          5 per app including you.
        </P>
        <OL>
          <li>
            Open the <a href="https://developer.spotify.com/dashboard">Spotify Developer Dashboard</a> and choose your AutoSort app.
          </li>
          <li>
            Go to <strong>User Management</strong> and add their name and the email they use for Spotify.
          </li>
          <li>Ask them to try connecting again.</li>
        </OL>
        <DocsNote tone="info" label="Tip">
          The email must match their Spotify login exactly, not just any email they own. See{' '}
          <Link href="/docs/family">Add family members</Link>.
        </DocsNote>
      </ErrorSection>

      <ErrorSection id="redirect" code="INVALID_CLIENT: Invalid redirect URI" title="Spotify says the redirect URI is invalid">
        <P>
          <strong>Cause:</strong> The Redirect URI saved in your Spotify app doesn&apos;t match your deployment character for character.
        </P>
        <P>
          <strong>Fix:</strong> Copy the exact value from your setup page and paste it into your Spotify app&apos;s settings under Redirect
          URIs:
        </P>
        <CopyRow value={EXAMPLE_REDIRECT_URI} label="Redirect URI" />
        <DocsNote tone="warning" label="Warning">
          Using a custom domain? Add the URI for that domain too, or sign-in breaks there. Testing locally? Spotify rejects{' '}
          <code>localhost</code>; register <code>{LOCAL_REDIRECT_URI}</code> and open the app at 127.0.0.1 instead.
        </DocsNote>
      </ErrorSection>

      <ErrorSection id="sync" code="Daily sync didn’t run" title="New songs aren’t being filed">
        <P>
          Check <strong>Settings → Instance → Daily sync</strong>. If it says “Not scheduled”, the cron job for <code>/api/sync</code> is
          missing from your deployment. Redeploy from the latest release, or follow{' '}
          <Link href="/docs/updating">Updating your AutoSort</Link>.
        </P>
        <DocsNote tone="violet" label="Important">
          On Vercel&apos;s free Hobby plan, cron jobs run at most once a day and can start any time within the scheduled hour, so a 6:00 AM
          sync may start as late as 6:59.
        </DocsNote>
      </ErrorSection>

      <ErrorSection id="rate" code="429 · Too many requests" title="“Spotify asked us to slow down”">
        <P>
          <strong>Cause:</strong> Spotify returns HTTP 429 when your Spotify app makes too many requests. The limit belongs to the Spotify
          app, so everyone on your AutoSort shares it. Short limits clear in seconds, and AutoSort waits them out on its own. Apps in
          Development Mode can also be paused for hours, sometimes most of a day. AutoSort then stops calling that part of Spotify until the
          pause ends and tells you how long it is.
        </P>
        <P>
          <strong>Fix:</strong> Wait it out. Reloading doesn&apos;t help, and the daily sync picks up again by itself once the pause ends. If
          it keeps happening, look in your Vercel project&apos;s logs for lines starting with <code>Spotify said 429</code>; they name the
          request and how long Spotify asked AutoSort to wait.
        </P>
      </ErrorSection>

      <ErrorSection id="public" code="Playlist shows as public" title="New playlists show up as public">
        <P>
          <strong>Cause:</strong> Spotify currently ignores the private setting for apps in Development Mode, so playlists AutoSort creates
          may appear on your profile.
        </P>
        <P>
          <strong>Fix:</strong> Open the playlist in Spotify and make it private from its menu. AutoSort keeps syncing it either way.
        </P>
      </ErrorSection>

      <P className="text-[15px]">
        Still stuck? <a href="https://github.com/iamtravjohnson/autosort/issues">Open an issue on GitHub</a> with the error text and what you
        were doing.
      </P>
    </DocsPage>
  );
}
