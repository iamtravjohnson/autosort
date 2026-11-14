import Link from 'next/link';
import type { ReactNode } from 'react';
import { Callout } from '@/components/access/auth-shell';
import { CopyButton } from '@/components/access/copy-button';
import { MAX_PEOPLE } from '@/lib/config';

const OWNER_STEPS =
  'Please add me to our AutoSort: open the Spotify Developer Dashboard (developer.spotify.com/dashboard), pick the AutoSort app, open User Management, and add my name and the email I use for Spotify. Then send me my invite link again.';

/** Friendly copy for each `/connect?error=` code from /api/auth/callback/spotify. */
export function errorNotice(code: string, owner: { start: string; mid: string }): ReactNode {
  switch (code) {
    case 'denied':
      return (
        <Callout tone="info" title="Spotify sign-in was cancelled">
          No problem. Connect again whenever you&apos;re ready.
        </Callout>
      );
    case 'state':
      return (
        <Callout title="That sign-in timed out">
          The sign-in took too long or was opened in another tab. Please try again.
        </Callout>
      );
    case 'exchange':
      return (
        <Callout title="Spotify didn’t finish the sign-in">
          <span>
            Usually the Redirect URI in the Spotify app doesn&apos;t match this AutoSort exactly. The owner can check it on the{' '}
            <Link href="/setup">setup page</Link>, then try again.
          </span>
        </Callout>
      );
    case 'not-allowlisted':
      return (
        <Callout title="You’re not on this AutoSort’s Spotify user list yet">
          <span>Spotify blocked the sign-in. {owner.start} needs to add you first:</span>
          <ol className="m-0 flex flex-col gap-1.5 pl-5 text-[#E4E4E7]">
            <li>In their Spotify Developer Dashboard, open this app → User Management.</li>
            <li>
              Add your name and <strong className="text-text-1">the email you use for Spotify</strong>.
            </li>
            <li>Then open your invite link again and connect.</li>
          </ol>
          <div className="pt-1">
            <CopyButton text={OWNER_STEPS} label="Copy steps for the owner" copiedLabel="Steps copied" />
          </div>
        </Callout>
      );
    case 'profile':
      return (
        <Callout title="We couldn’t read your Spotify profile">
          Spotify didn&apos;t answer in time. Please try again in a minute.
        </Callout>
      );
    case 'full':
      return (
        <Callout title="This AutoSort is full">
          Spotify allows {MAX_PEOPLE} people per AutoSort, and every spot is taken. Ask {owner.mid} to free one up.
        </Callout>
      );
    case 'invite-required':
      return (
        <Callout title="You need an invite to join">
          This AutoSort already has an owner. Ask {owner.mid} for an invite link from their Family page, then open it to connect.
        </Callout>
      );
    case 'invite-invalid':
      return (
        <Callout title="That invite link doesn’t work anymore">
          It expired or was already used. Ask {owner.mid} for a new one.
        </Callout>
      );
    default:
      return (
        <Callout title="Something went wrong signing in">
          Please try again.
        </Callout>
      );
  }
}
