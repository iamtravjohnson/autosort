import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell, Callout } from '@/components/access/auth-shell';
import { ConnectCard } from '@/components/access/connect-card';
import { ownerName, SPOTIFY_MANAGE_APPS_URL } from '@/lib/access';
import { MAX_PEOPLE } from '@/lib/config';
import { currentUser } from '@/lib/session';
import { setupStatus } from '@/lib/setup';
import { errorNotice } from '@/components/access/error-notice';

export const metadata: Metadata = { title: 'Connect Spotify' };


export default async function ConnectPage({ searchParams }: { searchParams: Promise<{ error?: string | string[]; deleted?: string | string[] }> }) {
  const status = await setupStatus();
  if (!status.ready) redirect('/setup');
  if (await currentUser()) redirect('/app');

  const params = await searchParams;
  const error = typeof params.error === 'string' ? params.error : null;
  const deleted = params.deleted === '1';
  const name = status.hasOwner ? await ownerName() : null;
  const owner = { start: name ?? 'The owner', mid: name ?? 'the owner' };
  const tryAgain = error === 'state' || error === 'exchange' || error === 'profile';

  const intro = status.hasOwner
    ? `Already a member? Connect to get back to your playlists. New here? You’ll need an invite link from ${owner.mid}.`
    : `The first person to connect becomes this AutoSort’s owner and can invite up to ${MAX_PEOPLE - 1} family members.`;

  return (
    <AuthShell glow="connect">
      <ConnectCard
        intro={intro}
        notice={
          <>
            {deleted ? (
              <Callout tone="info" title="Your data is deleted">
                <span>
                  Everything AutoSort stored for you is gone. To remove AutoSort from your Spotify account too, open{' '}
                  <a href={SPOTIFY_MANAGE_APPS_URL} target="_blank" rel="noopener noreferrer">
                    Manage apps on Spotify
                  </a>
                  .
                </span>
              </Callout>
            ) : null}
            {error ? errorNotice(error, owner) : null}
          </>
        }
        buttonLabel={tryAgain ? 'Try again' : 'Connect Spotify'}
      />
    </AuthShell>
  );
}
