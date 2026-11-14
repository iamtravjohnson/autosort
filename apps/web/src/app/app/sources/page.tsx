import type { Metadata } from 'next';
import Link from 'next/link';
import { NoSourcesYet } from '@/components/home/empty-state';
import { PlusGlyph } from '@/components/home/glyphs';
import { AddSourceCard, SourceStatCard, type SourceSummary } from '@/components/home/source-card';
import { userSmartPlaylists, userSources } from '@/lib/queries';
import { requireUser } from '@/lib/session';
import { addedThisWeek, filedToday, mosaicImages, playlistsFeeding, unmatchedTracks } from '@/lib/stats';

export const metadata: Metadata = { title: 'Sources · AutoSort' };

export default async function SourcesPage() {
  const user = await requireUser();
  const [sources, playlists] = await Promise.all([userSources(user.id), userSmartPlaylists(user.id)]);
  const summaries: SourceSummary[] = sources.map((s) => {
    const feeding = playlistsFeeding(s.id, playlists);
    return {
      id: s.id,
      name: s.name,
      images: mosaicImages(s),
      songs: s.snapshot?.length ?? 0,
      feeds: feeding.length,
      analyzedAt: s.snapshotAt,
      // "Unmatched" only means something once a smart playlist reads from the source.
      unmatched: s.snapshot && playlistsFeeding(s.id, playlists).length > 0 ? unmatchedTracks(s, playlists).length : 0,
      filedToday: filedToday(feeding),
      addedThisWeek: addedThisWeek(s.snapshot),
    };
  });

  return (
    <div className="flex min-h-full flex-col gap-6 p-6 sm:gap-8 sm:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-[640px] flex-col gap-2">
          <h1 className="m-0 text-[32px] font-extrabold tracking-[-0.03em] sm:text-[44px] sm:tracking-[-0.035em]">Sources</h1>
          <p className="m-0 text-[15px] leading-[1.5] text-text-2">
            The playlists AutoSort reads from. Keep adding songs to them in Spotify; AutoSort files the new ones every day. It never changes a source.
          </p>
        </div>
        {sources.length ? (
          <Link
            href="/app/sources/new"
            className="inline-flex h-11 items-center gap-2 rounded-pill bg-accent px-5 text-[14px] font-bold text-bg no-underline hover:bg-accent-hover hover:text-bg"
          >
            <PlusGlyph size={16} />
            Add a source
          </Link>
        ) : null}
      </header>
      {sources.length === 0 ? (
        <NoSourcesYet />
      ) : (
        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] sm:gap-6">
          {summaries.map((s) => (
            <li key={s.id} className="flex flex-col">
              <SourceStatCard s={s} />
            </li>
          ))}
          <li className="flex flex-col">
            <AddSourceCard className="min-h-[120px] flex-1" />
          </li>
        </ul>
      )}
    </div>
  );
}
