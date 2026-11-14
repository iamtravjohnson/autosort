import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ConfirmDialog } from '@/components/access/confirm-dialog';
import { LocalTime } from '@/components/access/local-time';
import { Avatar, ConnectionPill } from '@/components/access/people';
import { buttonClass, SpotifyLogo } from '@/components/ui';
import { connectionState, dailySchedule, instanceInfo, nextOwner, SPOTIFY_MANAGE_APPS_URL, spotsUsed } from '@/lib/access';
import { APP_VERSION, MAX_PEOPLE } from '@/lib/config';
import { timeAgo } from '@/lib/format';
import { spotifyStatus } from '@/lib/queries';
import { requireUser } from '@/lib/session';
import { updateLinks } from '@/lib/updates';
import { deleteMyData } from './actions';
import { withBase } from '@/lib/base-path';

export const metadata: Metadata = { title: 'Settings' };

const section = 'flex flex-col gap-4 rounded-card bg-surface-2 p-4 sm:p-5';
const h2 = 'm-0 text-[18px] font-bold';

function Row({ k, children, tone = 'text-text-1' }: { k: string; children: ReactNode; tone?: string }) {
  return (
    <div className="tnum flex justify-between gap-4 border-t border-line py-2.5 text-[14px]">
      <dt className="text-text-2">{k}</dt>
      <dd className={`m-0 min-w-0 break-words text-right font-semibold ${tone}`}>{children}</dd>
    </div>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  const isOwner = user.role === 'owner';
  const [account, info, spots, successor, updates] = await Promise.all([
    spotifyStatus(user.id),
    instanceInfo(),
    isOwner ? spotsUsed() : Promise.resolve(null),
    isOwner ? nextOwner(user.id) : Promise.resolve(null),
    isOwner ? updateLinks() : Promise.resolve(null),
  ]);
  const connection = connectionState(account);
  const schedule = dailySchedule();
  const name = user.displayName || 'You';

  const deleteBody = (
    <>
      <p className="m-0">
        This deletes everything AutoSort stored for you: your Spotify sign-in, sources, smart playlist rules and activity. Your playlists in
        Spotify stay where they are, but they&apos;ll stop updating.
      </p>
      {isOwner ? (
        <p className="m-0">
          {successor
            ? `${successor.name} will become this AutoSort’s owner.`
            : 'You’re the only person here, so the next person to connect becomes the owner.'}
        </p>
      ) : null}
      <p className="m-0">
        To remove AutoSort from your Spotify account too, open{' '}
        <a href={SPOTIFY_MANAGE_APPS_URL} target="_blank" rel="noopener noreferrer">
          Manage apps on Spotify
        </a>{' '}
        afterwards.
      </p>
    </>
  );
  const confirmProps = {
    title: 'Delete your AutoSort data?',
    confirmLabel: 'Delete and sign out',
    pendingLabel: 'Deleting…',
    action: deleteMyData,
    confirmText: 'I understand this can’t be undone.',
  };

  return (
    <div className="flex max-w-[880px] flex-col gap-6 p-6 sm:p-8">
      <h1 className="m-0 text-[32px] font-extrabold tracking-[-0.03em] sm:text-[44px] sm:tracking-[-0.035em]">Settings</h1>

      <section aria-labelledby="acct" className={section}>
        <div className="flex items-center justify-between gap-3">
          <h2 id="acct" className={h2}>
            Spotify account
          </h2>
          <SpotifyLogo width={78} />
        </div>
        <div className="flex flex-wrap items-center gap-3.5">
          <Avatar name={name} size={52} />
          <span className="flex min-w-[180px] flex-1 flex-col gap-1">
            <span className="text-[16px] font-bold">
              {name} · {isOwner ? 'Owner' : 'Member'}
            </span>
            <span>
              <ConnectionPill state={connection} />
            </span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <a href={withBase('/api/auth/login')} className={buttonClass(connection === 'connected' ? 'secondary' : 'primary', 'sm')}>
              Reconnect Spotify
            </a>
            <ConfirmDialog
              trigger="Disconnect Spotify"
              triggerClassName="inline-flex h-10 items-center rounded-pill border border-error/50 px-4 text-[14px] font-bold text-error-text transition-colors duration-[120ms] hover:bg-error/10"
              {...confirmProps}
            >
              {deleteBody}
            </ConfirmDialog>
          </div>
        </div>
        <p className="m-0 rounded-card bg-surface-3 px-3.5 py-3 text-[13px] leading-[1.5] text-text-2">
          {connection === 'connected'
            ? 'Reconnect if Spotify asks you to sign in again or a sync says permissions are missing. '
            : 'Spotify signed you out or AutoSort needs more permissions. Reconnect to keep your playlists syncing. '}
          Disconnecting deletes everything AutoSort stored from Spotify for you: tracks, analysis, rules and activity. Your playlists in Spotify stay
          where they are.
        </p>
        {isOwner && spots ? (
          <Link
            href="/app/family"
            className="tnum flex items-center justify-between rounded-card bg-surface-3 px-3.5 py-3 text-text-1 no-underline hover:bg-[#2E2E33] hover:text-text-1"
          >
            <span className="flex flex-col">
              <span className="text-[14px] font-bold">Family</span>
              <span className="text-[13px] text-text-2">
                {Math.min(spots.used, MAX_PEOPLE)} of {MAX_PEOPLE} spots used
                {spots.pending ? ` · ${spots.pending} invite${spots.pending === 1 ? '' : 's'} pending` : ''}
              </span>
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="text-text-2">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        ) : null}
        <form action={withBase('/api/auth/logout')} method="post" className="flex justify-end">
          <button type="submit" className="inline-flex h-10 items-center rounded-pill px-3 text-[14px] font-bold text-text-2 transition-colors duration-[120ms] hover:text-text-1">
            Sign out
          </button>
        </form>
      </section>

      <section aria-labelledby="sync" className={section}>
        <h2 id="sync" className={h2}>
          Sync
        </h2>
        <dl className="m-0 flex flex-col">
          <Row k="Daily sync">{schedule.label}</Row>
        </dl>
        <div className="flex flex-col gap-1.5 text-[13px] leading-[1.55] text-text-2">
          <p className="m-0">
            Every day AutoSort checks your sources and files new songs into your smart playlists.{' '}
            {schedule.utcHour !== null && schedule.utcMinute !== null ? <LocalTime utcHour={schedule.utcHour} utcMinute={schedule.utcMinute} /> : null}
          </p>
          <p className="m-0 text-text-3">
            The time is set in <code>vercel.json</code> in your AutoSort&apos;s code
            {schedule.cron ? (
              <>
                {' '}
                (<code>&quot;schedule&quot;: &quot;{schedule.cron}&quot;</code>)
              </>
            ) : null}
            . To change it, edit that line and let Vercel redeploy. It&apos;s one schedule for everyone in your family.
          </p>
        </div>
      </section>

      <section aria-labelledby="inst" className={section}>
        <h2 id="inst" className={h2}>
          Instance
        </h2>
        <dl className="m-0 flex flex-col">
          <Row k="Version">
            v{APP_VERSION}
            {updates ? (
              <>
                {' · '}
                <a href={updates.runUrl} target="_blank" rel="noopener noreferrer" className="font-bold">
                  Update now
                </a>
                {' · '}
                <a href={updates.setupUrl} target="_blank" rel="noopener noreferrer">
                  First time? Add the update action
                </a>
              </>
            ) : null}
          </Row>
          <Row k="Deployment">{info.deployment ?? 'Local'}</Row>
          <Row k="Database" tone="text-success-text">
            {info.dbSize ? `Connected · ${info.dbSize}` : 'Connected'}
          </Row>
          <Row k="Daily sync" tone={info.lastCronAt ? 'text-success-text' : 'text-text-3'}>
            {info.lastCronAt ? `Last ran ${timeAgo(info.lastCronAt)}` : info.onVercel ? 'Scheduled · hasn’t run yet' : 'Runs on Vercel only'}
          </Row>
          <Row k="Mood data (Last.fm)" tone={info.lastfm ? 'text-success-text' : 'text-text-3'}>
            {info.lastfm ? 'On' : 'Off · optional'}
          </Row>
        </dl>
      </section>

      <section aria-labelledby="data" className={section}>
        <h2 id="data" className={h2}>
          Your data
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex flex-col">
            <span className="text-[14px] font-bold">Export</span>
            <span className="text-[13px] text-text-2">Your sources, smart playlist rules and activity as a JSON file.</span>
          </span>
          <a href={withBase('/api/export')} download className={buttonClass('secondary', 'sm')}>
            Export my data
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3.5">
          <span className="flex flex-col">
            <span className="text-[14px] font-bold text-error-text">Delete my data</span>
            <span className="text-[13px] text-text-2">Removes your sources, rules and history from this AutoSort and signs you out. Can&apos;t be undone.</span>
          </span>
          <ConfirmDialog
            trigger="Delete my data…"
            triggerClassName="inline-flex h-10 items-center rounded-pill bg-[#7F1D1D] px-4 text-[14px] font-bold text-white transition-colors duration-[120ms] hover:bg-[#991B1B]"
            {...confirmProps}
          >
            {deleteBody}
          </ConfirmDialog>
        </div>
      </section>
    </div>
  );
}
