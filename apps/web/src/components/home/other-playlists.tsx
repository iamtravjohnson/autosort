import type { PlaylistSummary } from '@autosort/core';
import Image from 'next/image';
import Link from 'next/link';
import { SpotifyLogo } from '@/components/ui';
import type { User } from '@/db/schema';
import { listMyPlaylists } from '@/lib/spotify';
import { friendlyError } from '@/lib/stats';
import { SPOTIFY_NAME_SUFFIX } from '@/lib/sync';
import { InfoGlyph, LockGlyph } from './glyphs';
import { withBase } from '@/lib/base-path';

const ART = ['#2F4A40', '#4A4530', '#4A302F', '#3A2F4A', '#2F3B4A', '#4A3B2A', '#3E2F4A'];
const LIMIT = 24;

function Header() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h2 id="other" className="m-0 text-[18px] font-bold sm:text-[22px]">
          Your other playlists
        </h2>
        <p className="m-0 hidden text-[14px] text-text-2 sm:block">Sort any playlist you own by BPM, key, energy or mood. One-off; no syncing.</p>
      </div>
      <SpotifyLogo width={78} />
    </div>
  );
}

/** "Your other playlists": everything in the user's library that isn't a source or made by AutoSort, with Sort buttons. */
export async function OtherPlaylists({ user, hideIds }: { user: User; hideIds: string[] }) {
  let lists: PlaylistSummary[];
  try {
    lists = await listMyPlaylists(user.id);
  } catch (err) {
    const e = friendlyError(err);
    return (
      <section aria-labelledby="other" className="flex flex-col gap-3.5">
        <Header />
        <p role="status" className="m-0 rounded-card bg-surface-2 px-4 py-3.5 text-[14px] text-text-2">
          We couldn&apos;t load your playlists. {e.message}{' '}
          {e.reconnect ? (
            <a href={withBase('/api/auth/login')} className="font-bold">
              Reconnect Spotify
            </a>
          ) : null}
        </p>
      </section>
    );
  }

  const hide = new Set(hideIds);
  const others = lists.filter((p) => !hide.has(p.id) && !p.name.endsWith(SPOTIFY_NAME_SUFFIX));
  const shown = others.slice(0, LIMIT);
  const anyLocked = shown.some((p) => p.ownerId !== user.spotifyId && !p.collaborative);

  return (
    <section aria-labelledby="other" className="flex flex-col gap-3.5">
      <Header />
      {others.length === 0 ? (
        <p className="m-0 text-[14px] text-text-2">No other playlists in your Spotify library yet.</p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-1 gap-2.5 p-0 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] sm:gap-3">
          {shown.map((p, i) => {
            const mine = p.ownerId === user.spotifyId;
            const locked = !mine && !p.collaborative;
            const tracks = p.itemCount === null ? '' : ` · ${p.itemCount.toLocaleString('en-US')} ${p.itemCount === 1 ? 'track' : 'tracks'}`;
            const meta = locked ? 'Followed · not yours' : `${mine && !p.collaborative ? 'Yours' : 'Collaborative'}${tracks}`;
            return (
              <li key={p.id} className="tnum flex items-center gap-3 sm:gap-3.5 sm:rounded-card sm:bg-surface-2 sm:p-2.5">
                <span className={`size-[52px] shrink-0 overflow-hidden rounded-art sm:size-14 ${locked ? 'opacity-55' : ''}`} style={{ background: ART[i % ART.length] }} aria-hidden="true">
                  {p.imageUrl ? <Image src={p.imageUrl} alt="" width={56} height={56} unoptimized className="size-full object-cover" /> : null}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={`truncate text-[15px] font-semibold sm:font-bold ${locked ? 'text-text-2' : ''}`}>{p.name}</span>
                  <span className="truncate text-[12px] text-text-2 sm:text-[13px]">{meta}</span>
                </span>
                {locked ? (
                  <span
                    title="Spotify only lets apps read playlists you own or collaborate on."
                    className="flex shrink-0 items-center gap-1.5 px-1 text-[12px] text-text-3"
                  >
                    <LockGlyph size={14} />
                    Not yours
                  </span>
                ) : (
                  <Link
                    href={`/app/sort/${p.id}`}
                    aria-label={`Sort ${p.name}`}
                    className="flex h-9 shrink-0 items-center rounded-pill border border-white/30 px-4 text-[13px] font-bold text-text-1 no-underline hover:border-white/60 hover:text-text-1"
                  >
                    Sort
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {others.length > LIMIT ? (
        <p className="m-0 text-[13px] text-text-2">
          Showing {LIMIT} of {others.length.toLocaleString('en-US')}. <Link href="/app/sort">See them all in Sort</Link>
        </p>
      ) : null}
      {anyLocked ? (
        <p className="m-0 flex items-start gap-2 text-[13px] text-text-3">
          <InfoGlyph size={14} className="mt-0.5 shrink-0" />
          Followed playlists are locked: Spotify only lets apps read playlists you own or collaborate on.
        </p>
      ) : null}
    </section>
  );
}

/** Loading rows while Spotify answers (AppStates "Table loading"). */
export function OtherPlaylistsSkeleton() {
  return (
    <section aria-labelledby="other" aria-busy="true" className="flex flex-col gap-3.5">
      <Header />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
        {[70, 55, 80, 62].map((w) => (
          <div key={w} className="flex items-center gap-3.5 rounded-card bg-surface-2 p-2.5">
            <span className="size-14 shrink-0 rounded-art bg-surface-3" />
            <span className="flex flex-1 flex-col gap-1.5">
              <span className="h-3 rounded-art bg-surface-3" style={{ width: `${w}%` }} />
              <span className="h-2.5 w-2/5 rounded-art bg-[#202024]" />
            </span>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading your playlists…</span>
    </section>
  );
}
