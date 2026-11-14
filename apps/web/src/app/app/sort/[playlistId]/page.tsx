import { enrichTracks, LastfmClient, type PlaylistSummary, type TrackFacts } from '@autosort/core';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { ActionNotice } from '@/components/editor/bits';
import { ExternalIcon } from '@/components/icons';
import { SortView } from '@/components/sort/sort-view';
import type { SortRow } from '@/components/sort/types';
import { buttonClass } from '@/components/ui';
import { dbCache } from '@/lib/cache';
import { duration } from '@/lib/format';
import { userSmartPlaylists } from '@/lib/queries';
import { playlistIdSchema, spotifyErrorResult, spotifyPlaylistUrl, type ActionError } from '@/lib/rules-ui';
import { requireUser } from '@/lib/session';
import { spotifyFor } from '@/lib/spotify';

export const metadata: Metadata = { title: 'Sort a playlist' };

/**
 * Lookup budget for this page. Sorting only needs audio data (BPM, key, energy), so genre, year
 * and tag lookups use what's already cached instead of making the page wait on slow services.
 */
const SORT_BUDGET = { artists: 0, audio: 4000, years: 0, tags: 0 };

const HEADER_BG = 'linear-gradient(180deg, #2C5A4C 0%, #1B3029 55%, #141416 100%)';

type Loaded =
  | { kind: 'ok'; summary: PlaylistSummary; facts: TrackFacts[]; hidden: number }
  | { kind: 'missing' }
  | { kind: 'not-yours'; name: string }
  | { kind: 'error'; error: ActionError };

async function load(userId: string, spotifyId: string, playlistId: string): Promise<Loaded> {
  try {
    const client = await spotifyFor(userId);
    const summary = (await client.myPlaylists()).find((p) => p.id === playlistId);
    if (!summary) return { kind: 'missing' };
    if (summary.ownerId !== spotifyId && !summary.collaborative) return { kind: 'not-yours', name: summary.name };
    const refs = await client.playlistTracks(playlistId);
    const lastfm = process.env.LASTFM_API_KEY ? new LastfmClient({ apiKey: process.env.LASTFM_API_KEY }) : null;
    const { tracks } = await enrichTracks(refs, { spotify: client, cache: dbCache, lastfm, budget: SORT_BUDGET });
    const hidden = summary.itemCount !== null ? Math.max(0, summary.itemCount - refs.length) : 0;
    return { kind: 'ok', summary, facts: tracks, hidden };
  } catch (err) {
    console.error('sort page load failed', err);
    return { kind: 'error', error: spotifyErrorResult(err) };
  }
}

function toRows(facts: TrackFacts[]): SortRow[] {
  const seen = new Map<string, number>();
  return facts.map((t) => {
    const n = (seen.get(t.id) ?? 0) + 1;
    seen.set(t.id, n);
    return {
      key: n === 1 ? t.id : `${t.id}#${n}`,
      id: t.id,
      uri: t.uri,
      name: t.name,
      artist: t.artists.map((a) => a.name).join(', '),
      album: t.album.name,
      imageUrl: t.album.imageUrl,
      addedAt: t.addedAt,
      releaseDate: t.album.releaseDate,
      durationMs: t.durationMs,
      tempo: t.audio ? t.audio.tempo : null,
      camelot: t.camelot,
      energy: t.audio ? t.audio.energy : null,
      valence: t.audio ? t.audio.valence : null,
    };
  });
}

function Breadcrumb({ name }: { name?: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex gap-2 text-[13px] text-text-2">
      <Link href="/app/sort" className="text-text-2 no-underline hover:text-text-1">
        Sort
      </Link>
      <span aria-hidden="true">/</span>
      <span className="truncate text-text-1" aria-current="page">
        {name ?? 'Playlist'}
      </span>
    </nav>
  );
}

function Message({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-3 px-6 pb-6 pt-8 sm:px-8 sm:pt-12" style={{ background: HEADER_BG }}>
        <Breadcrumb />
        <h1 className="m-0 text-[28px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[40px]">{title}</h1>
      </header>
      <div className="flex flex-col items-start gap-4 px-6 pb-8 sm:px-8">{children}</div>
    </div>
  );
}

async function SortLoader({ userId, spotifyId, playlistId }: { userId: string; spotifyId: string; playlistId: string }) {
  const data = await load(userId, spotifyId, playlistId);

  if (data.kind === 'missing') {
    return (
      <Message title="We couldn't find that playlist">
        <p className="m-0 max-w-[620px] text-[15px] leading-[1.6] text-text-2">It isn&apos;t in your Spotify library anymore. Pick another one to sort.</p>
        <Link href="/app/sort" className={buttonClass('secondary', 'sm')}>
          All playlists
        </Link>
      </Message>
    );
  }
  if (data.kind === 'not-yours') {
    return (
      <Message title={`${data.name} isn't yours to change`}>
        <p className="m-0 max-w-[620px] text-[15px] leading-[1.6] text-text-2">
          Spotify only lets apps change playlists you own or collaborate on. To sort it, copy its songs into a new playlist of your own in the Spotify app, then sort that one here.
        </p>
        <Link href="/app/sort" className={buttonClass('secondary', 'sm')}>
          All playlists
        </Link>
      </Message>
    );
  }
  if (data.kind === 'error') {
    return (
      <Message title="Couldn't read this playlist">
        <ActionNotice result={data.error} />
        <Link href={`/app/sort/${playlistId}`} className={buttonClass('secondary', 'sm')}>
          Try again
        </Link>
      </Message>
    );
  }

  const { summary, facts, hidden } = data;
  const rows = toRows(facts);
  const smart = (await userSmartPlaylists(userId)).find((p) => p.spotifyPlaylistId === playlistId);
  const tempos = rows.map((r) => r.tempo).filter((t): t is number => t !== null);
  const avgBpm = tempos.length ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : null;
  const keys = new Set(rows.map((r) => r.camelot).filter(Boolean)).size;
  const totalMs = rows.reduce((n, r) => n + r.durationMs, 0);
  const stats = [`${rows.length.toLocaleString('en-US')} track${rows.length === 1 ? '' : 's'}`, duration(totalMs), avgBpm ? `Avg ${avgBpm} BPM` : null, `${keys} of 24 keys`].filter(
    (s): s is string => Boolean(s),
  );

  return (
    <div className="flex flex-col">
      <header className="flex flex-wrap items-end gap-4 px-6 pb-6 pt-6 sm:gap-7 sm:px-8 sm:pt-12" style={{ background: HEADER_BG }}>
        <div className="basis-full">
          <Breadcrumb name={summary.name} />
        </div>
        <div className="size-[72px] shrink-0 overflow-hidden rounded-art bg-[#2F4A40] shadow-[0_24px_64px_rgba(0,0,0,0.5)] sm:size-[184px]">
          {summary.imageUrl ? <Image src={summary.imageUrl} alt="" width={184} height={184} unoptimized className="size-full object-cover" /> : null}
        </div>
        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1.5 sm:gap-2.5">
          <span className="hidden text-[13px] font-bold sm:block">Playlist · one-off sort</span>
          <h1 className="m-0 break-words text-[24px] font-extrabold leading-[1.05] tracking-[-0.02em] sm:text-[clamp(44px,6vw,80px)] sm:leading-[0.95] sm:tracking-[-0.045em]">{summary.name}</h1>
          <ul className="tnum m-0 flex list-none flex-wrap gap-y-2 p-0 text-[12px] text-[#E4E4E7] sm:gap-2 sm:text-[13px]">
            {stats.map((s, i) => (
              <li key={s} className="sm:rounded-pill sm:bg-black/35 sm:px-3 sm:py-[5px] sm:font-semibold">
                {i > 0 ? (
                  <span aria-hidden="true" className="px-1.5 sm:hidden">
                    ·
                  </span>
                ) : null}
                {s}
              </li>
            ))}
          </ul>
        </div>
        <a
          href={spotifyPlaylistUrl(summary.id)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${summary.name} in Spotify`}
          className="hidden size-12 items-center justify-center rounded-pill bg-black/40 text-text-1 hover:bg-black/60 hover:text-text-1 sm:flex"
        >
          <ExternalIcon size={18} />
        </a>
      </header>

      <div className="flex flex-col gap-4 px-6 pb-8 sm:px-8">
        <p className="m-0 max-w-[720px] text-[14px] leading-[1.6] text-text-2">
          Try a sort, compare it with the original, then save it to Spotify. Nothing changes in Spotify until you save (moving or removing songs is the exception: those happen right away).
        </p>
        {smart ? (
          <p role="note" className="m-0 rounded-card border border-info/30 bg-info/[0.08] px-4 py-3 text-[14px] leading-[1.6] text-[#E0F2FE]">
            This is your smart playlist {smart.name}. AutoSort puts it back in its own order at every sync, so a one-off sort won&apos;t last.{' '}
            <Link href={`/app/playlists/${smart.id}`}>Change its order in the editor</Link> instead.
          </p>
        ) : null}
        {rows.length === 0 ? (
          <p className="m-0 rounded-card bg-surface-2 p-6 text-[15px] text-text-2">This playlist is empty. Add some songs in Spotify, then come back.</p>
        ) : (
          <SortView playlist={{ id: summary.id, name: summary.name, hidden, smartPlaylistId: smart?.id ?? null }} rows={rows} />
        )}
      </div>
    </div>
  );
}

function SortLoading() {
  return (
    <div className="flex flex-col" aria-busy="true">
      <header className="flex flex-wrap items-end gap-4 px-6 pb-6 pt-6 sm:gap-7 sm:px-8 sm:pt-12" style={{ background: HEADER_BG }}>
        <div className="basis-full">
          <Breadcrumb />
        </div>
        <div className="size-[72px] shrink-0 animate-pulse rounded-art bg-white/10 sm:size-[184px]" />
        <div className="flex flex-1 flex-col gap-3">
          <span className="h-4 w-40 rounded-art bg-white/10" />
          <span className="h-10 w-3/5 max-w-[520px] rounded-art bg-white/10 sm:h-16" />
        </div>
      </header>
      <div className="flex flex-col gap-3 px-6 pb-8 sm:px-8">
        <p role="status" className="m-0 text-[14px] text-text-2">
          Reading your playlist and looking up BPM and key… big playlists can take a minute.
        </p>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-sm bg-surface-2 p-2">
            <span className="size-10 rounded-art bg-surface-3" />
            <span className="flex flex-1 flex-col gap-1.5">
              <span className="h-3 w-2/5 rounded-art bg-surface-3" />
              <span className="h-3 w-1/4 rounded-art bg-surface-3" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function SortPlaylistPage({ params }: { params: Promise<{ playlistId: string }> }) {
  const user = await requireUser();
  const { playlistId } = await params;
  if (!playlistIdSchema.safeParse(playlistId).success) notFound();
  return (
    <Suspense fallback={<SortLoading />}>
      <SortLoader userId={user.id} spotifyId={user.spotifyId} playlistId={playlistId} />
    </Suspense>
  );
}
