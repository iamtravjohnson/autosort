'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useState } from 'react';
import { removeSource } from '@/app/app/sources/[id]/actions';
import { AnalyzeProgress } from '@/components/analyze/analyze-progress';
import { useAnalysis } from '@/components/analyze/use-analysis';
import { buttonClass } from '@/components/ui';
import type { ActionState } from '@/lib/stats';
import { ActionMessage } from './action-message';
import { SyncGlyph } from './glyphs';

/** "Refresh analysis": re-reads the source with live progress. */
export function RefreshAnalysisButton({ sourceId, sourceName, variant = 'secondary' }: { sourceId: string; sourceName: string; variant?: 'primary' | 'secondary' }) {
  const { state, run } = useAnalysis();
  const router = useRouter();
  const busy = state.status === 'running';
  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => void run(sourceId).then((ok) => ok && router.refresh())}
        className={buttonClass(variant, 'md', 'disabled:cursor-wait disabled:opacity-70')}
      >
        <SyncGlyph size={16} className={busy ? 'animate-spin' : ''} />
        {busy ? 'Analyzing…' : 'Refresh analysis'}
      </button>
      <div className="basis-full empty:hidden">
        {state.status === 'running' || state.status === 'done' ? (
          <AnalyzeProgress name={sourceName} state={state} doneLabel={`Done. Read ${state.songs?.toLocaleString('en-US') ?? 0} songs.`} />
        ) : state.status === 'error' ? (
          <ActionMessage state={{ message: state.message, reconnect: state.reconnect }} />
        ) : null}
      </div>
    </>
  );
}

/** "Remove this source" with an inline confirm step. Doesn't touch Spotify. */
export function RemoveSource({ sourceId, name, onlyFeeds }: { sourceId: string; name: string; onlyFeeds: number }) {
  const [state, formAction, pending] = useActionState<ActionState | null, FormData>(removeSource, null);
  const [confirming, setConfirming] = useState(false);
  return (
    <section aria-labelledby="remove-source" className="flex flex-col gap-3 border-t border-line pt-6">
      <h2 id="remove-source" className="sr-only">
        Remove this source
      </h2>
      {!confirming ? (
        <div>
          <button type="button" onClick={() => setConfirming(true)} className="h-10 text-[14px] font-bold text-error-text hover:text-error">
            Remove this source
          </button>
        </div>
      ) : (
        <form action={formAction} className="flex flex-col gap-3 rounded-card border border-error/40 bg-error/[0.08] p-4">
          <input type="hidden" name="sourceId" value={sourceId} />
          <p className="m-0 text-[15px] leading-[1.5] text-text-1">
            Stop using <strong>{name}</strong> as a source? Nothing changes in Spotify: the playlist and your smart playlists stay as they are.
            {onlyFeeds > 0
              ? ` ${onlyFeeds === 1 ? '1 smart playlist reads' : `${onlyFeeds} smart playlists read`} only from ${name}, so ${onlyFeeds === 1 ? 'it' : 'they'} will be paused.`
              : ''}
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button type="submit" disabled={pending} className="inline-flex h-10 items-center justify-center rounded-pill bg-error-text px-5 text-[14px] font-bold whitespace-nowrap text-bg hover:bg-error disabled:cursor-wait disabled:opacity-70">
              {pending ? 'Removing…' : `Remove ${name}`}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={pending} className={buttonClass('ghost', 'sm')}>
              Cancel
            </button>
          </div>
        </form>
      )}
      <ActionMessage state={state} />
    </section>
  );
}
