import { missingScopes, SPOTIFY_ALL_SCOPES } from '@autosort/core';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { NoSourcesYet } from '@/components/home/empty-state';
import { PlusGlyph } from '@/components/home/glyphs';
import { Greeting } from '@/components/home/greeting';
import { OtherPlaylists, OtherPlaylistsSkeleton } from '@/components/home/other-playlists';
import { SmartPlaylistCard } from '@/components/home/smart-playlist-card';
import { AddSourceCard, SourceRowCard, type SourceSummary } from '@/components/home/source-card';
import { SyncNowButton } from '@/components/home/sync-now';
import { buttonClass } from '@/components/ui';
import { spotifyStatus, userSmartPlaylists, userSources } from '@/lib/queries';
import { requireUser } from '@/lib/session';
import { addedThisWeek, filedToday, mosaicImages, playlistsFeeding, unmatchedTracks } from '@/lib/stats';

export const metadata: Metadata = { title: 'Home · AutoSort' };

const SHOWN = 8;

export default async function HomePage() {
  const user = await requireUser();
  const [sources, playlists, spotify] = await Promise.all([userSources(user.id), userSmartPlaylists(user.id), spotifyStatus(user.id)]);
  const needsReconnect = !spotify || spotify.status === 'reconnect' || missingScopes(spotify.scope, SPOTIFY_ALL_SCOPES).length > 0;
  const firstName = user.displayName?.trim().split(/\s+/)[0] ?? null;

  const summaries: SourceSummary[] = sources.map((s) => {
    const feeding = playlistsFeeding(s.id, playlists);
    return {
      id: s.id,
      name: s.name,
      images: mosaicImages(s),
      songs: s.snapshot?.length ?? 0,
      feeds: feeding.length,
      analyzedAt: s.snapshotAt,
      unmatched: s.snapshot ? unmatchedTracks(s, playlists).length : 0,
      filedToday: filedToday(feeding),
      addedThisWeek: addedThisWeek(s.snapshot),
    };
  });
  const sourceName = new Map(sources.map((s) => [s.id, s.name]));
  const fromText = (ids: string[]) => ids.map((id) => sourceName.get(id)).filter(Boolean).join(' + ');
  const singleSource = sources.length === 1 ? sources[0] : null;
  const hideIds = [
    ...sources.map((s) => s.playlistId).filter((id): id is string => Boolean(id)),
    ...playlists.map((p) => p.spotifyPlaylistId).filter((id): id is string => Boolean(id)),
  ];

  return (
    <div className="flex min-h-full flex-col gap-7 p-6 sm:gap-9 sm:p-8" style={{ background: 'linear-gradient(180deg, #1F1A2E 0px, #141416 320px)' }}>
      <header className="flex flex-wrap items-center justify-between gap-4 sm:items-end">
        <div className="flex min-w-0 items-center gap-2.5">
          {firstName ? (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-accent-hover text-[15px] font-extrabold text-bg sm:hidden" aria-hidden="true">
              {firstName[0]?.toUpperCase()}
            </span>
          ) : null}
          <Greeting firstName={firstName} />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {playlists.length ? <SyncNowButton /> : null}
          <Link
            href="/app/playlists/new"
            aria-label="New smart playlist"
            className="inline-flex h-11 w-11 items-center justify-center gap-2 rounded-pill bg-accent text-[14px] font-bold text-bg no-underline hover:bg-accent-hover hover:text-bg sm:w-auto sm:px-5"
          >
            <PlusGlyph size={16} />
            <span className="hidden sm:inline">New smart playlist</span>
          </Link>
        </div>
      </header>

      {sources.length === 0 ? (
        <NoSourcesYet />
      ) : (
        <>
          <section aria-labelledby="sources" className="flex flex-col gap-3 sm:gap-3.5">
            <h2 id="sources" className="m-0 text-[18px] font-bold sm:text-[22px]">
              Sources
            </h2>
            <div className="flex flex-wrap gap-4">
              {summaries.map((s) => (
                <SourceRowCard key={s.id} s={s} />
              ))}
              <AddSourceCard className="flex-[1_1_260px]" />
            </div>
          </section>

          <section aria-labelledby="smart" className="flex flex-col gap-3 sm:gap-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="smart" className="m-0 text-[18px] font-bold sm:text-[22px]">
                Smart playlists
                {singleSource && playlists.length ? <span className="hidden text-[16px] font-medium text-text-3 sm:inline"> · from {singleSource.name}</span> : null}
              </h2>
              {playlists.length ? (
                <Link href="/app/playlists" className="text-[13px] font-bold sm:text-[14px]">
                  Show all{playlists.length > SHOWN ? ` ${playlists.length}` : ''}
                </Link>
              ) : null}
            </div>
            {playlists.length === 0 ? (
              <div className="flex flex-col items-start gap-3 rounded-card bg-surface-2 p-5">
                <p className="m-0 text-[15px] text-text-2">
                  No smart playlists yet. AutoSort can suggest some from {singleSource ? singleSource.name : 'your sources'}: Country, 90s Country, Love Songs and more.
                </p>
                <Link href={singleSource ? `/app/sources/${singleSource.id}/suggestions` : '/app/sources'} className={buttonClass('primary', 'sm')}>
                  See Smart suggestions
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] sm:gap-5">
                {playlists.slice(0, SHOWN).map((p) => (
                  <SmartPlaylistCard key={p.id} playlist={p} from={sources.length > 1 ? fromText(p.sourceIds) : undefined} needsReconnect={needsReconnect} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <Suspense fallback={<OtherPlaylistsSkeleton />}>
        <OtherPlaylists user={user} hideIds={hideIds} />
      </Suspense>
    </div>
  );
}
