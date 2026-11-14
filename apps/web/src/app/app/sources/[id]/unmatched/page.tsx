import { ruleChips, suggestPlaylists } from '@autosort/core';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckGlyph } from '@/components/home/glyphs';
import { type MenuTarget, type SuggestionView, type UnmatchedRow, UnmatchedList, UnmatchedSuggestions } from '@/components/home/unmatched-list';
import { SpotifyLogo } from '@/components/ui';
import { coverGradient } from '@/lib/format';
import { getSource, userSmartPlaylists } from '@/lib/queries';
import { requireUser } from '@/lib/session';
import { genreText, moodLabel, playlistsFeeding, unmatchedTracks } from '@/lib/stats';
import { fromSnapshot } from '@/lib/sync';

type Props = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ROWS = 500;

export const metadata: Metadata = { title: 'Unmatched songs · AutoSort' };

export default async function UnmatchedPage({ params }: Props) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const user = await requireUser();
  const [source, playlists] = await Promise.all([getSource(user.id, id), userSmartPlaylists(user.id)]);
  if (!source) notFound();

  const unmatched = unmatchedTracks(source, playlists);
  // Newest first: the songs someone just added are the ones they're wondering about.
  unmatched.sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? ''));
  const suggestions: SuggestionView[] = suggestPlaylists(unmatched.map(fromSnapshot), { existingRules: playlists.map((p) => p.rule), minSize: 5 })
    .slice(0, 3)
    .map((s) => ({ key: s.key, name: s.name, count: s.count, chips: ruleChips(s.rule), cover: coverGradient(s.name) }));
  const targets: MenuTarget[] = playlistsFeeding(source.id, playlists).map((p) => ({ id: p.id, name: p.name, cover: coverGradient(p.name) }));
  const rows: UnmatchedRow[] = unmatched.slice(0, MAX_ROWS).map((t) => ({
    id: t.id,
    title: t.name,
    artists: t.artists.join(', '),
    tags: genreText(t),
    year: t.year,
    mood: moodLabel(t),
    imageUrl: t.imageUrl,
  }));
  const n = unmatched.length;

  return (
    <div className="flex min-h-full flex-col gap-6 p-6 sm:p-8" style={{ background: 'linear-gradient(180deg, #3A3220 0px, #141416 260px)' }}>
      <div className="flex flex-col gap-2">
        <nav aria-label="Breadcrumb" className="flex min-w-0 gap-2 text-[13px] text-text-2">
          <Link href={`/app/sources/${source.id}`} className="truncate text-text-2 no-underline hover:text-text-1">
            {source.name}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="shrink-0 text-text-1" aria-current="page">
            Unmatched songs
          </span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="tnum m-0 text-[32px] font-extrabold tracking-[-0.03em] sm:text-[44px] sm:tracking-[-0.035em]">
            {n.toLocaleString('en-US')} unmatched {n === 1 ? 'song' : 'songs'}
          </h1>
          <SpotifyLogo width={78} className="mb-1" />
        </div>
        <p className="m-0 max-w-[720px] text-[15px] leading-[1.5] text-text-2">
          These songs are in {source.name} but don&apos;t fit any of your smart playlists. File them by hand, or let AutoSort suggest a new playlist.
        </p>
      </div>

      {!source.snapshot ? (
        <p className="m-0 rounded-card bg-surface-2 p-5 text-[15px] text-text-2">
          We haven&apos;t read {source.name} yet. <Link href={`/app/sources/${source.id}`}>Open it and refresh the analysis.</Link>
        </p>
      ) : n === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-panel bg-surface-2 px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-pill bg-success/[0.14] text-success-text">
            <CheckGlyph size={24} />
          </span>
          <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">Every song has a home</h2>
          <p className="m-0 max-w-[360px] text-[15px] text-text-2">Each song in {source.name} fits at least one of your smart playlists.</p>
        </div>
      ) : (
        <>
          {suggestions.length ? <UnmatchedSuggestions sourceId={source.id} suggestions={suggestions} /> : null}
          <UnmatchedList sourceId={source.id} sourceName={source.name} rows={rows} targets={targets} />
          {n > MAX_ROWS ? (
            <p className="m-0 text-[13px] text-text-3">
              Showing the newest {MAX_ROWS.toLocaleString('en-US')} of {n.toLocaleString('en-US')}. File some, or make a new smart playlist, to see the rest.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
