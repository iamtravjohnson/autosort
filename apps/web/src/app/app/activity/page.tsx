import type { Metadata } from 'next';
import Link from 'next/link';
import type { SyncRun } from '@/db/schema';
import { coverGradient, timeAgo } from '@/lib/format';
import { recentRuns, userSources } from '@/lib/queries';
import { requireUser } from '@/lib/session';
import { friendlyErrorText, olderThanDays } from '@/lib/stats';
import { type RunLine, RunList, type RunView } from './run-list';

export const metadata: Metadata = { title: 'Activity · AutoSort' };

type Filter = 'all' | 'daily' | 'saves' | 'problems';
type Props = { searchParams: Promise<{ filter?: string | string[] }> };

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'daily', label: 'Daily sync' },
  { key: 'saves', label: 'Saves' },
  { key: 'problems', label: 'Problems' },
];

const KIND_LABEL: Record<SyncRun['kind'], string> = {
  daily: 'Daily sync',
  manual: 'Sync now',
  create: 'New playlists',
  edit: 'Playlist edit',
  sort: 'One-off sort',
  restore: 'Undo',
};

const hasProblem = (r: SyncRun) => r.status === 'error' || r.status === 'partial' || r.results.some((x) => x.error);

function matches(r: SyncRun, f: Filter): boolean {
  if (f === 'daily') return r.kind === 'daily' || r.kind === 'manual';
  if (f === 'saves') return r.kind === 'create' || r.kind === 'edit' || r.kind === 'sort' || r.kind === 'restore';
  if (f === 'problems') return hasProblem(r);
  return true;
}

function plural(n: number, word: string) {
  return `${n.toLocaleString('en-US')} ${n === 1 ? word : `${word}s`}`;
}

function toView(r: SyncRun, unmatchedHref: string): RunView {
  const restoreCount = Object.keys(r.restore).length;
  const createdCount = r.createdPlaylistIds.length;
  const running = r.status === 'running';
  const problem = hasProblem(r);
  const tone: RunView['tone'] = problem ? 'problem' : r.kind === 'restore' ? 'restore' : r.kind === 'daily' || r.kind === 'manual' ? 'sync' : 'save';

  const lines: RunLine[] = [];
  if (r.error) lines.push({ key: 'run-error', name: 'This run stopped early', cover: '#4A302F', count: '', note: friendlyErrorText(r.error), tone: 'error' });
  r.results.forEach((x, i) => {
    const changes = [x.added ? `+${x.added.toLocaleString('en-US')}` : '', x.removed ? `−${x.removed.toLocaleString('en-US')}` : ''].filter(Boolean).join(' · ');
    lines.push({
      key: `${x.smartPlaylistId ?? x.playlistId ?? x.name}-${i}`,
      name: x.name,
      cover: coverGradient(x.name),
      count: x.error ? 'failed' : x.created ? `New${changes ? ` · ${changes}` : ''}` : changes || 'No changes',
      note: x.error ? friendlyErrorText(x.error) : x.created ? 'Created in Spotify' : null,
      tone: x.error ? 'error' : 'muted',
    });
  });
  if (r.unmatched && (r.kind === 'daily' || r.kind === 'manual')) {
    lines.push({ key: 'unmatched', name: 'Unmatched', cover: '#3A3A40', count: r.unmatched.toLocaleString('en-US'), note: null, tone: 'muted', href: unmatchedHref });
  }

  const filed = r.results.filter((x) => x.added > 0 && !x.error).map((x) => `${x.added.toLocaleString('en-US')} ${x.name}`);
  const failed = r.results.filter((x) => x.error).length;
  const parts =
    r.kind === 'create' || createdCount
      ? [r.results.filter((x) => x.created).map((x) => x.name).join(', ')].filter(Boolean)
      : [...filed.slice(0, 4), ...(filed.length > 4 ? [`${filed.length - 4} more`] : [])];
  if (failed) parts.push(`${failed} failed`);
  if (r.unmatched && (r.kind === 'daily' || r.kind === 'manual')) parts.push(`${r.unmatched.toLocaleString('en-US')} unmatched`);

  const undoable = !running && !r.undoneAt && !olderThanDays(r.startedAt, 30) && (restoreCount > 0 || createdCount > 0);
  let undo: RunView['undo'] = null;
  if (undoable) {
    const deleteLabel = createdCount === 1 ? 'Delete this playlist' : `Delete these ${createdCount} playlists`;
    if (r.kind === 'sort') undo = { label: 'Restore original order', note: 'Puts the playlist back in the order it had before.', confirm: null };
    else if (createdCount && !restoreCount)
      undo = {
        label: deleteLabel,
        note: 'Removes them from your Spotify library and from AutoSort.',
        confirm: `${createdCount === 1 ? 'This playlist is' : `These ${createdCount} playlists are`} removed from your Spotify library and from AutoSort. This can’t be undone.`,
      };
    else
      undo = {
        label: 'Undo this sync',
        note: `Puts every playlist back exactly as it was before this run.${createdCount ? ` ${plural(createdCount, 'playlist')} it created will be deleted.` : ''}`,
        confirm: createdCount ? `This also deletes ${plural(createdCount, 'playlist')} the run created. That part can’t be undone.` : null,
      };
  }

  return {
    id: r.id,
    kindLabel: KIND_LABEL[r.kind],
    tone,
    startedAt: r.startedAt.toISOString(),
    ago: timeAgo(r.startedAt),
    title: running ? 'Running…' : (r.summary ?? (r.status === 'error' ? 'Didn’t finish' : KIND_LABEL[r.kind])),
    summary: parts.join(' · ') || (running || r.kind === 'restore' ? '' : 'No changes'),
    running,
    lines,
    empty: lines.length ? null : r.kind === 'restore' ? 'Put playlists back the way they were.' : running ? 'Still working…' : 'Nothing changed in Spotify.',
    undo,
    undoneAgo: r.undoneAt ? timeAgo(r.undoneAt) : null,
  };
}

export default async function ActivityPage({ searchParams }: Props) {
  const user = await requireUser();
  const raw = (await searchParams).filter;
  const filter: Filter = FILTERS.some((f) => f.key === raw) ? (raw as Filter) : 'all';
  const [runs, sources] = await Promise.all([recentRuns(user.id, 60), userSources(user.id)]);
  const unmatchedHref = sources.length === 1 ? `/app/sources/${sources[0]!.id}/unmatched` : '/app/sources';
  const views = runs.filter((r) => matches(r, filter)).map((r) => toView(r, unmatchedHref));

  return (
    <div className="flex min-h-full flex-col p-6 sm:p-8 sm:py-10" style={{ background: 'linear-gradient(180deg, #1C2A33 0px, #141416 260px)' }}>
      <div className="flex w-full max-w-[1000px] flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="m-0 text-[32px] font-extrabold tracking-[-0.03em] sm:text-[44px] sm:tracking-[-0.035em]">Activity</h1>
            <p className="m-0 text-[15px] text-text-2">Every sync and save. Undo anything from the last 30 days.</p>
          </div>
          <nav aria-label="Filter activity" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const on = f.key === filter;
              return (
                <Link
                  key={f.key}
                  href={f.key === 'all' ? '/app/activity' : `/app/activity?filter=${f.key}`}
                  aria-current={on ? 'page' : undefined}
                  className={`flex h-9 items-center rounded-pill px-3.5 text-[13px] font-bold no-underline ${on ? 'bg-white text-bg hover:text-bg' : 'bg-surface-3 text-text-1 hover:bg-[#303035] hover:text-text-1'}`}
                >
                  {f.label}
                </Link>
              );
            })}
          </nav>
        </div>
        {views.length ? (
          <RunList key={filter} runs={views} />
        ) : (
          <p className="m-0 rounded-card bg-surface-2 px-5 py-8 text-center text-[15px] text-text-2">
            {filter === 'problems'
              ? 'No problems in the last 30 days.'
              : filter === 'all'
                ? 'Nothing yet. Your first sync shows up here.'
                : 'Nothing here in the last 30 days.'}
          </p>
        )}
      </div>
    </div>
  );
}
