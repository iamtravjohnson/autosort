import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddedPerYear } from '@/components/charts/added-per-year';
import { CamelotRing } from '@/components/charts/camelot-ring';
import { CleanExplicit } from '@/components/charts/clean-explicit';
import { DecadeBars } from '@/components/charts/decade-bars';
import { GenreTreemap } from '@/components/charts/genre-treemap';
import { MoodScatter } from '@/components/charts/mood-scatter';
import { ChevronLeftGlyph, ExternalGlyph } from '@/components/home/glyphs';
import { Mosaic } from '@/components/home/mosaic';
import { RefreshAnalysisButton, RemoveSource } from '@/components/home/source-actions';
import { buttonClass, SpotifyLogo } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { getSource, userSmartPlaylists } from '@/lib/queries';
import { requireUser } from '@/lib/session';
import { mosaicImages, pendingText, playlistsFeeding, sourceStats, spotifySourceUrl, unmatchedTracks } from '@/lib/stats';

type Props = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  const source = UUID.test(id) ? await getSource(user.id, id) : null;
  return { title: source ? `${source.name} · AutoSort` : 'Source · AutoSort' };
}

function Stat({ value, label, tone }: { value: string; label: string; tone?: 'warn' }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-card bg-surface-2 px-3.5 py-3 sm:px-[18px] sm:py-4">
      <span className={`text-[22px] font-extrabold tracking-[-0.02em] sm:text-[28px] ${tone === 'warn' ? 'text-warning-text' : ''}`}>{value}</span>
      <span className="text-[12px] text-text-2 sm:text-[13px]">{label}</span>
    </div>
  );
}

function Meter({ label, value, total }: { label: string; value: number; total: number }) {
  const share = total ? (value / total) * 100 : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] sm:text-[14px]">
        <strong>
          {label} for {value.toLocaleString('en-US')} of {total.toLocaleString('en-US')} songs
        </strong>{' '}
        <span className="text-text-2">({Math.round(share)}%)</span>
      </span>
      <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={value} className="h-1.5 overflow-hidden rounded-pill bg-surface-3">
        <span className="block h-full rounded-pill bg-accent" style={{ width: `${share}%` }} />
      </div>
    </div>
  );
}

function hoursText(ms: number): string {
  const h = Math.round(ms / 3_600_000);
  if (h >= 1) return `about ${h.toLocaleString('en-US')} hr`;
  return `${Math.max(1, Math.round(ms / 60_000))} min`;
}

export default async function SourcePage({ params }: Props) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const user = await requireUser();
  const [source, playlists] = await Promise.all([getSource(user.id, id), userSmartPlaylists(user.id)]);
  if (!source) notFound();

  const snapshot = source.snapshot ?? [];
  const stats = sourceStats(snapshot);
  const unmatched = source.snapshot ? unmatchedTracks(source, playlists).length : 0;
  const feeding = playlistsFeeding(source.id, playlists);
  const onlyFeeds = feeding.filter((p) => p.sourceIds.length === 1).length;
  const pending = pendingText(source.pending);
  const analyzed = Boolean(source.snapshotAt);
  const owner = user.displayName ?? 'You';
  const yearRange = stats.yearMin !== null && stats.yearMax !== null ? (stats.yearMin === stats.yearMax ? String(stats.yearMin) : `${stats.yearMin}–${stats.yearMax}`) : '—';

  return (
    <div className="flex min-h-full flex-col">
      <header
        className="flex flex-col gap-4 px-6 pb-5 pt-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-7 sm:px-8 sm:pb-7 sm:pt-[72px]"
        style={{ background: 'linear-gradient(180deg, #5B4A6E 0%, #2A2333 60%, #141416 100%)' }}
      >
        <Link href="/app/sources" aria-label="Back to sources" className="-ml-2 flex size-11 items-center justify-center rounded-pill text-text-1 hover:text-text-1 sm:hidden">
          <ChevronLeftGlyph size={22} />
        </Link>
        <Mosaic images={mosaicImages(source)} size={200} className="self-center shadow-[0_24px_64px_rgba(0,0,0,0.5)] sm:self-auto" />
        <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-2.5">
          <span className="hidden text-[13px] font-bold sm:block">Source playlist</span>
          <h1 className="m-0 break-words text-[32px] font-extrabold leading-[0.95] tracking-[-0.03em] sm:text-[clamp(48px,7vw,96px)] sm:tracking-[-0.045em]">{source.name}</h1>
          <p className="tnum m-0 text-[13px] text-[#E4E4E7] sm:text-[14px]">
            <strong>{source.kind === 'liked' ? `${owner}'s Liked Songs` : owner}</strong> · {stats.songs.toLocaleString('en-US')} {stats.songs === 1 ? 'song' : 'songs'}
            {stats.totalMs ? ` · ${hoursText(stats.totalMs)}` : ''} · <span className="text-text-2">{analyzed ? `analyzed ${timeAgo(source.snapshotAt)}` : 'not analyzed yet'}</span>
          </p>
        </div>
        <SpotifyLogo width={78} className="sm:mb-1" />
      </header>

      <div className="flex flex-col gap-6 px-6 pb-10 sm:gap-7 sm:px-8">
        <div className="flex flex-wrap items-center gap-2.5 pt-2 sm:gap-3">
          <Link href={`/app/sources/${source.id}/suggestions`} className={buttonClass('primary', 'md', 'flex-1 sm:flex-none')}>
            See Smart suggestions
          </Link>
          <Link href={`/app/sources/${source.id}/unmatched`} className={buttonClass('secondary', 'md', 'tnum')}>
            Unmatched songs · {unmatched.toLocaleString('en-US')}
          </Link>
          <a
            href={spotifySourceUrl(source)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${source.name} in Spotify`}
            className="flex size-12 items-center justify-center rounded-pill bg-surface-3 text-text-1 hover:bg-[#303035] hover:text-text-1"
          >
            <ExternalGlyph size={18} />
          </a>
          <RefreshAnalysisButton sourceId={source.id} songs={stats.songs} />
        </div>

        {!analyzed ? (
          <div className="flex flex-col gap-2 rounded-card bg-surface-2 p-5">
            <h2 className="m-0 text-[18px] font-bold">We haven&apos;t read {source.name} yet</h2>
            <p className="m-0 text-[15px] text-text-2">Use Refresh analysis to read it from Spotify and look up genres, tempo, key and mood.</p>
          </div>
        ) : (
          <>
            <div className="tnum grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] sm:gap-3">
              <Stat value={stats.songs.toLocaleString('en-US')} label={stats.songs === 1 ? 'song' : 'songs'} />
              <Stat value={`+${stats.addedThisWeek.toLocaleString('en-US')}`} label="added this week" />
              <Stat value={stats.genresFound.toLocaleString('en-US')} label={stats.genresFound === 1 ? 'genre found' : 'genres found'} />
              <Stat value={yearRange} label="release years" />
            </div>

            <div className="tnum flex flex-col gap-3 rounded-card bg-surface-2 px-3.5 py-3 sm:px-4 sm:py-3.5">
              <Meter label="Tempo & key found" value={stats.withAudio} total={stats.songs} />
              <Meter label="Release years found" value={stats.withYear} total={stats.songs} />
              <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-text-3 sm:text-[13px]">
                <span>Data: ReccoBeats, MusicBrainz, Last.fm · genres from Spotify artists</span>
                {unmatched ? (
                  <Link href={`/app/sources/${source.id}/unmatched`} className="font-bold">
                    {unmatched.toLocaleString('en-US')} unmatched · review
                  </Link>
                ) : null}
              </div>
              {pending ? (
                <p role="status" className="m-0 rounded-sm bg-warning/[0.08] px-3 py-2 text-[13px] text-[#FEF3C7]">
                  {pending}
                </p>
              ) : null}
            </div>

            <h2 className="m-0 mt-2 text-[20px] font-extrabold tracking-[-0.02em] sm:text-[28px]">What&apos;s inside {source.name}</h2>
            <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[repeat(auto-fit,minmax(420px,1fr))]">
              <GenreTreemap slices={stats.genres} genreTable={stats.genreTable} noGenre={stats.noGenre} songs={stats.songs} />
              <DecadeBars decades={stats.decades} songs={stats.songs} />
              <MoodScatter mood={stats.mood} />
              <CamelotRing keys={stats.keys} top={stats.topKey} withKey={stats.withKey} songs={stats.songs} />
              <AddedPerYear rows={stats.addedPerYear} />
              <CleanExplicit clean={stats.clean} explicit={stats.explicit} />
            </div>
          </>
        )}

        <RemoveSource sourceId={source.id} name={source.name} onlyFeeds={onlyFeeds} />
      </div>
    </div>
  );
}
