import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell, Callout } from '@/components/access/auth-shell';
import { ConnectCard } from '@/components/access/connect-card';
import { buttonClass } from '@/components/ui';
import { findInvite } from '@/lib/access';
import { currentUser } from '@/lib/session';
import { setupStatus } from '@/lib/setup';
import { errorNotice } from '@/components/access/error-notice';

export const metadata: Metadata = { title: 'Join' };

/** Family invite landing page: /join/<token>. */
export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const status = await setupStatus();
  if (!status.ready) redirect('/setup');
  const [invite, user] = await Promise.all([findInvite(token), currentUser()]);

  if (invite.state !== 'valid') {
    const title =
      invite.state === 'used' ? 'This invite was already used' : invite.state === 'expired' ? 'This invite has expired' : 'We couldn’t find this invite';
    const who = invite.state === 'missing' ? 'the person who sent it' : invite.inviter;
    return (
      <AuthShell glow="connect">
        <ConnectCard
          intro="Invite links work once and expire after a week."
          showConnect={false}
          notice={
            <Callout title={title}>
              <span>
                Ask {who} for a new link. They can make one on their Family page.
                {invite.state === 'used' ? ' If you already joined with it, just sign in.' : ''}
              </span>
            </Callout>
          }
        >
          <Link href="/connect" className={buttonClass('secondary', 'md', 'w-full')}>
            {user ? 'Go to AutoSort' : 'Already a member? Sign in'}
          </Link>
        </ConnectCard>
      </AuthShell>
    );
  }

  const first = invite.name.trim().split(/\s+/)[0] || invite.name;
  return (
    <AuthShell glow="connect">
      <ConnectCard
        inviter={invite.inviter}
        intro={`Hi ${first}! You’ll get your own sources and smart playlists. ${invite.inviter} can’t see or change yours.`}
        href={`/api/auth/login?invite=${encodeURIComponent(token)}`}
        notice={
          <>
            {error ? errorNotice(error, { start: invite.inviter, mid: invite.inviter }) : null}
            <Callout tone="info" title="Before you connect">
              <span>
                {invite.inviter} needs to add the email you use for Spotify
                {invite.email ? (
                  <>
                    {' '}
                    (<strong className="break-all text-text-1">{invite.email}</strong>)
                  </>
                ) : null}{' '}
                under User Management in their Spotify developer dashboard. If Spotify says you&apos;re not on the list, ask them to check, then
                open this link again.
              </span>
            </Callout>
            {user ? (
              <Callout tone="info">
                <span>
                  You&apos;re signed in as {user.displayName || 'someone else'}. Connecting here signs in with the Spotify account you pick instead.{' '}
                  <Link href="/app">Go to AutoSort</Link>
                </span>
              </Callout>
            ) : null}
          </>
        }
      />
    </AuthShell>
  );
}
