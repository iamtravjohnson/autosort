import type { ReactNode } from 'react';

type Marker = 'violet' | 'amber' | 'ring' | 'teal';

const MARKER: Record<Marker, string> = {
  violet: 'bg-accent',
  amber: 'bg-[#F59E0B]',
  ring: 'border-2 border-warning',
  teal: 'bg-success',
};

function Event({ marker, last = false, children }: { marker: Marker; last?: boolean; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <div className="flex flex-col items-center" aria-hidden="true">
        <span className={`mt-[5px] box-border size-3 shrink-0 rounded-pill ${MARKER[marker]}`} />
        {last ? null : <span className="w-0.5 flex-1 bg-surface-3" />}
      </div>
      <div className={`flex min-w-0 flex-col gap-1 ${last ? '' : 'pb-5'}`}>{children}</div>
    </li>
  );
}

function Time({ children }: { children: ReactNode }) {
  return <span className="text-[13px] font-bold text-text-3">{children}</span>;
}

/** "It keeps itself updated" card: one example morning sync, as a timeline. */
export function SyncTimeline() {
  return (
    <figure className="tnum m-0 flex min-w-0 flex-[1_1_460px] flex-col gap-5 rounded-panel border border-line bg-surface-1 p-6">
      <figcaption className="text-[12px] font-bold uppercase tracking-[0.08em] text-text-3">Example daily sync</figcaption>
      <ol className="m-0 flex list-none flex-col p-0">
        <Event marker="violet">
          <Time>6:00 AM</Time>
          <span className="text-[16px] font-bold">14 new songs in Favs</span>
        </Event>
        <Event marker="amber">
          <span className="sr-only">Filed into smart playlists:</span>
          <span className="flex flex-wrap gap-2">
            {['+5 Country', '+2 90s Country', '+4 Workout'].map((c) => (
              <span key={c} className="rounded-pill bg-surface-2 px-3 py-1.5 text-[14px] font-semibold">
                {c}
              </span>
            ))}
          </span>
        </Event>
        <Event marker="ring">
          <span className="text-[16px] font-semibold">3 unmatched</span>
          <span className="text-[14px] text-text-2">Waiting for you in Unmatched songs</span>
        </Event>
        <Event marker="teal" last>
          <Time>6:01 AM</Time>
          <span className="text-[16px] font-semibold">Saved to Spotify · logged with Undo</span>
        </Event>
      </ol>
    </figure>
  );
}
