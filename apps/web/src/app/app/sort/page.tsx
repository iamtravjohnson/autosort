import type { PlaylistSummary } from '@autosort/core';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ActionNotice, Art } from '@/components/editor/bits';
import { InfoIcon } from '@/components/icons';
import { buttonClass, SpotifyLogo } from '@/components/ui';
import { userSmartPlaylists } from '@/lib/queries';
import { spotifyErrorResult, type ActionError } from '@/lib/rules-ui';
import { requireUser } from '@/lib/session';
import { spotifyFor } from '@/lib/spotify';

export const metadata: Metadata = { title: 'Sort a playlist' };

async function loadPlaylists(userId: string): Promise<{ playlists: PlaylistSummary[]; error: ActionError | null }> {
  try {
    return { playlists: await (await spotifyFor(userId)).myPlaylists(), error: null };
  } catch (err) {
    console.error('sort list load failed', err);
    return { playlists: [], error: spotifyErrorResult(err) };
  }
}

function songs(n: number | null): string {
  return n === null ? 'Playlist' : `${n.toLocaleString('en-US')} song${n === 1 ? '' : 's'}`;
}

function Row({ p, meta, action, href, locked }: { p: PlaylistSummary; meta: string; action?: string; href?: string; locked?: boolean }) {
  const body = (
    <>
      <Art url={p.imageUrl} size={56} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-bold text-text-1">{p.name}</span>
        <span className="tnum truncate text-[13px] text-text-2">{meta}</span>
      </span>
      {action ? <span className="flex h-9 shrink-0 items-center rounded-pill border border-white/30 px-4 text-[13px] font-bold text-text-1">{action}</span> : null}
      {locked ? (
        <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-text-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Not yours
        </span>
      ) : null}
    </>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className="flex items-center gap-3.5 rounded-card bg-surface-2 p-2.5 no-underline hover:bg-surface-3">
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-3.5 rounded-card bg-surface-2 p-2.5 opacity-70">{body}</div>
      )}
    </li>
  );
}

export default async function SortListPage() {
  const user = await requireUser();
  const [{ playlists, error }, smart] = await Promise.all([loadPlaylists(user.id), userSmartPlaylists(user.id)]);
  const smartBySpotify = new Map(smart.filter((p) => p.spotifyPlaylistId).map((p) => [p.spotifyPlaylistId!, p]));
  const yours = playlists.filter((p) => (p.ownerId === user.spotifyId || p.collaborative) && !smartBySpotify.has(p.id));
  const autos = playlists.filter((p) => smartBySpotify.has(p.id));
  const followed = playlists.filter((p) => p.ownerId !== user.spotifyId && !p.collaborative);
  const grid = 'm-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]';

  return (
    <div className="flex flex-col">
      <header className="flex flex-wrap items-end justify-between gap-6 px-6 pb-7 pt-8 sm:px-8 sm:pt-12" style={{ background: 'linear-gradient(180deg, #1B3029 0px, #141416 100%)' }}>
        <div className="flex max-w-[640px] flex-col gap-2.5">
          <h1 className="m-0 text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[44px] sm:tracking-[-0.035em]">Sort a playlist</h1>
          <p className="m-0 text-[15px] leading-[1.55] text-text-2 sm:text-[16px]">
            Pick a playlist you own. Sort it by BPM, key, energy or date, check the new order, then save it. One-off: it won&apos;t keep re-sorting.
          </p>
        </div>
        <SpotifyLogo width={78} />
      </header>

      <div className="flex flex-col gap-8 px-6 pb-8 sm:px-8">
        {error ? (
          <div className="flex flex-col items-start gap-3 rounded-card bg-surface-2 p-6">
            <h2 className="m-0 text-[18px] font-bold">Couldn&apos;t load your playlists</h2>
            <ActionNotice result={error} />
            {!error.reconnect ? (
              <Link href="/app/sort" className={buttonClass('secondary', 'sm')}>
                Try again
              </Link>
            ) : null}
          </div>
        ) : null}

        {!error ? (
          <section aria-labelledby="yours" className="flex flex-col gap-3.5">
            <h2 id="yours" className="m-0 text-[22px] font-bold">
              Your playlists
            </h2>
            {yours.length ? (
              <ul className={grid}>
                {yours.map((p) => (
                  <Row key={p.id} p={p} meta={`${songs(p.itemCount)}${p.collaborative && p.ownerId !== user.spotifyId ? ' · collaborative' : ''}`} action="Sort" href={`/app/sort/${p.id}`} />
                ))}
              </ul>
            ) : (
              <p className="m-0 text-[15px] text-text-2">No playlists of your own yet. Make one in Spotify, then come back to sort it.</p>
            )}
          </section>
        ) : null}

        {autos.length ? (
          <section aria-labelledby="autos" className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <h2 id="autos" className="m-0 text-[22px] font-bold">
                Smart playlists
              </h2>
              <p className="m-0 text-[14px] text-text-2">AutoSort keeps these in their own order. Change it in the editor so it sticks.</p>
            </div>
            <ul className={grid}>
              {autos.map((p) => {
                const s = smartBySpotify.get(p.id)!;
                return <Row key={p.id} p={p} meta={`${songs(p.itemCount)} · smart playlist`} action="Edit" href={`/app/playlists/${s.id}`} />;
              })}
            </ul>
          </section>
        ) : null}

        {followed.length ? (
          <section aria-labelledby="followed" className="flex flex-col gap-3.5">
            <h2 id="followed" className="m-0 text-[22px] font-bold">
              Playlists you follow
            </h2>
            <ul className={grid}>
              {followed.map((p) => (
                <Row key={p.id} p={p} meta={songs(p.itemCount)} locked />
              ))}
            </ul>
            <p className="m-0 flex items-center gap-2 text-[13px] text-text-3">
              <InfoIcon size={14} className="shrink-0" />
              Followed playlists are locked: Spotify only lets apps change playlists you own or collaborate on.
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
