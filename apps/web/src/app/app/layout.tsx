import { missingScopes, SPOTIFY_ALL_SCOPES } from '@autosort/core';
import Link from 'next/link';
import { MobileTabs, SidebarNav } from '@/components/app/nav';
import { Logo } from '@/components/logo';
import { SpotifyLogo } from '@/components/ui';
import { dailySchedule } from '@/lib/access';
import { coverGradient, timeAgo } from '@/lib/format';
import { lastRun, spotifyStatus, userSmartPlaylists, userSources } from '@/lib/queries';
import { requireUser } from '@/lib/session';

// Syncs and analyses run inside server actions on these pages.
export const maxDuration = 300;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [sources, playlists, run, spotify] = await Promise.all([userSources(user.id), userSmartPlaylists(user.id), lastRun(user.id), spotifyStatus(user.id)]);
  const schedule = dailySchedule().label.toLowerCase();
  const needsReconnect = !spotify || spotify.status === 'reconnect' || missingScopes(spotify.scope, SPOTIFY_ALL_SCOPES).length > 0;
  const library = [
    ...playlists.map((p) => ({ id: p.id, href: `/app/playlists/${p.id}`, name: p.name, meta: `Smart · ${p.trackCount ?? 0} songs`, cover: coverGradient(p.name) })),
    ...sources.map((s) => ({ id: s.id, href: `/app/sources/${s.id}`, name: s.name, meta: `Source · ${s.snapshot?.length ?? 0} songs`, cover: 'linear-gradient(90deg,#4A3B2A 50%,#2F3B4A 50%)' })),
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      {needsReconnect ? (
        <div role="status" className="flex flex-wrap items-center justify-center gap-3 bg-accent-tint px-4 py-2.5 text-[14px] text-[#E9E3FF]">
          <span>{spotify?.status === 'reconnect' ? 'Spotify signed you out.' : 'AutoSort needs a few more Spotify permissions.'}</span>
          <a href="/api/auth/login" className="font-bold text-accent-soft">
            Reconnect Spotify
          </a>
        </div>
      ) : null}
      <div className="flex flex-1 gap-2 p-2 pb-24 lg:pb-2">
        <aside aria-label="AutoSort navigation" className="hidden w-[288px] shrink-0 flex-col gap-2 lg:flex">
          <nav className="flex flex-col gap-0.5 rounded-panel bg-surface-1 px-3 py-4">
            <div className="px-3 pb-3.5 pt-1">
              <Logo />
            </div>
            <SidebarNav />
          </nav>
          <div className="flex min-h-0 flex-1 flex-col gap-2 rounded-panel bg-surface-1 p-3">
            <div className="flex items-center justify-between px-2 pb-2 pt-1">
              <h2 className="m-0 text-[15px] font-bold text-text-2">Your Playlists</h2>
              <Link href="/app/playlists/new" aria-label="New smart playlist" className="flex size-8 items-center justify-center rounded-pill text-text-2 hover:text-text-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </Link>
            </div>
            <div className="flex min-h-0 flex-col overflow-y-auto">
              {library.length === 0 ? <p className="m-0 px-2 text-[13px] text-text-3">Pick a source to get started.</p> : null}
              {library.map((p) => (
                <Link key={p.id} href={p.href} className="flex items-center gap-3 rounded-sm px-2 py-1.5 text-text-1 no-underline hover:bg-surface-2">
                  <span className="size-11 shrink-0 rounded-art" style={{ background: p.cover }} aria-hidden="true" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[14px] font-semibold">{p.name}</span>
                    <span className="tnum truncate text-[13px] text-text-3">{p.meta}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <main id="main" className="min-w-0 flex-1 overflow-clip rounded-panel bg-surface-1">
            {children}
          </main>
          <footer className="tnum hidden min-h-16 flex-wrap items-center justify-between gap-4 px-4 py-2.5 lg:flex">
            <div className="flex items-center gap-3 text-[13px] text-text-2">
              <span className={`size-2 rounded-pill ${run?.status === 'error' ? 'bg-error' : run?.status === 'partial' ? 'bg-warning' : 'bg-success'}`} aria-hidden="true" />
              <span>
                {run ? (
                  <>
                    <strong className="text-text-1">Last sync {timeAgo(run.finishedAt ?? run.startedAt)}</strong>
                    {run.summary ? ` · ${run.summary}` : ''} · {schedule}
                  </>
                ) : (
                  `No syncs yet · ${schedule}`
                )}
              </span>
            </div>
            <SpotifyLogo tone="white" width={78} />
          </footer>
        </div>
      </div>
      <MobileTabs />
    </div>
  );
}
