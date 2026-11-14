import Link from 'next/link';
import { count, timeAgo } from '@/lib/format';
import { ChevronRightGlyph, PlusGlyph } from './glyphs';
import { Mosaic } from './mosaic';

export interface SourceSummary {
  id: string;
  name: string;
  images: string[];
  songs: number;
  feeds: number;
  analyzedAt: Date | null;
  unmatched: number;
  filedToday: number;
  addedThisWeek: number;
}

function AnalyzedPill({ at }: { at: Date | null }) {
  return (
    <span className="flex items-center gap-1.5 rounded-pill bg-surface-3 px-2.5 py-1">
      <span className={`size-[7px] rounded-pill sm:size-2 ${at ? 'bg-success' : 'bg-warning'}`} aria-hidden="true" />
      {at ? `Analyzed ${timeAgo(at)}` : 'Not analyzed yet'}
    </span>
  );
}

/** Home's source card: art, name, "N songs · feeds N", status chips. */
export function SourceRowCard({ s }: { s: SourceSummary }) {
  return (
    <Link
      href={`/app/sources/${s.id}`}
      className="tnum flex flex-[2_1_480px] flex-col gap-3 rounded-card bg-surface-2 p-3.5 text-text-1 no-underline hover:bg-[#222226] hover:text-text-1 sm:flex-row sm:items-center sm:gap-[18px] sm:p-4"
    >
      <span className="flex min-w-0 flex-1 items-center gap-3 sm:gap-[18px]">
        <Mosaic images={s.images} size={96} sizeClass="size-16 sm:size-24" />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="truncate text-[20px] font-extrabold tracking-[-0.02em] sm:text-[24px]">{s.name}</span>
          <span className="text-[13px] text-text-2 sm:text-[14px]">
            {count(s.songs, 'song')} · feeds {count(s.feeds, 'smart playlist')}
          </span>
          <span className="hidden flex-wrap gap-2 text-[13px] font-semibold sm:flex">
            <AnalyzedPill at={s.analyzedAt} />
            {s.filedToday ? <span className="rounded-pill bg-surface-3 px-2.5 py-1">{count(s.filedToday, 'new song')} filed today</span> : null}
            {s.unmatched ? <span className="rounded-pill bg-warning/[0.14] px-2.5 py-1 text-warning-text">{s.unmatched.toLocaleString('en-US')} unmatched</span> : null}
          </span>
        </span>
      </span>
      <span className="flex flex-wrap gap-1.5 text-[12px] font-semibold sm:hidden">
        <AnalyzedPill at={s.analyzedAt} />
        {s.filedToday ? <span className="rounded-pill bg-surface-3 px-2.5 py-1">{s.filedToday.toLocaleString('en-US')} filed today</span> : null}
        {s.unmatched ? <span className="rounded-pill bg-warning/[0.14] px-2.5 py-1 text-warning-text">{s.unmatched.toLocaleString('en-US')} unmatched</span> : null}
      </span>
      <ChevronRightGlyph size={20} className="hidden shrink-0 text-text-2 sm:block" />
    </Link>
  );
}

/** Source card from the Components board: art, eyebrow, name, 2×2 stats, status. */
export function SourceStatCard({ s }: { s: SourceSummary }) {
  const stats: Array<[string, string, boolean]> = [
    [s.songs.toLocaleString('en-US'), s.songs === 1 ? 'song' : 'songs', false],
    [`+${s.addedThisWeek.toLocaleString('en-US')}`, 'added this week', false],
    [s.feeds.toLocaleString('en-US'), s.feeds === 1 ? 'smart playlist fed' : 'smart playlists fed', false],
    [s.unmatched.toLocaleString('en-US'), 'unmatched', s.unmatched > 0],
  ];
  return (
    <Link
      href={`/app/sources/${s.id}`}
      className="flex flex-col gap-4 rounded-card border border-line bg-surface-2 p-5 text-text-1 no-underline hover:bg-[#222226] hover:text-text-1"
    >
      <span className="flex items-center gap-3">
        <Mosaic images={s.images} size={56} />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-3">Source</span>
          <span className="truncate text-[20px] font-extrabold tracking-[-0.02em]">{s.name}</span>
        </span>
      </span>
      <span className="tnum grid grid-cols-2 gap-x-3 gap-y-3.5">
        {stats.map(([value, label, warn]) => (
          <span key={label} className="flex flex-col">
            <span className={`text-[22px] font-extrabold ${warn ? 'text-warning' : ''}`}>{value}</span>
            <span className="text-[12px] text-text-2">{label}</span>
          </span>
        ))}
      </span>
      <span className="flex items-center gap-1.5 text-[12px] text-text-3">
        <span className={`size-2 rounded-pill ${s.analyzedAt ? 'bg-success' : 'bg-warning'}`} aria-hidden="true" />
        {s.analyzedAt ? `Analyzed ${timeAgo(s.analyzedAt)}` : 'Not analyzed yet'}
      </span>
    </Link>
  );
}

/** Dashed "Add a source" card. */
export function AddSourceCard({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/app/sources/new"
      className={`flex items-center gap-3.5 rounded-card border-[1.5px] border-dashed border-white/20 p-4 text-left text-text-1 no-underline hover:border-white/40 hover:text-text-1 ${className}`}
    >
      <span className="flex size-14 shrink-0 items-center justify-center rounded-art bg-surface-3 text-text-2">
        <PlusGlyph size={22} strokeWidth={2} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] font-bold">Add a source</span>
        <span className="text-[13px] text-text-2">Liked Songs or another playlist you add to</span>
      </span>
    </Link>
  );
}
