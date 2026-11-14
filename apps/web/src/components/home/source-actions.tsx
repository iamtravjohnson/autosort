'use client';

import { useActionState, useState } from 'react';
import { refreshAnalysis, removeSource } from '@/app/app/sources/[id]/actions';
import { buttonClass } from '@/components/ui';
import type { ActionState } from '@/lib/stats';
import { ActionMessage } from './action-message';
import { SyncGlyph } from './glyphs';

/** "Refresh analysis": re-reads the source with a pending state. */
export function RefreshAnalysisButton({ sourceId, songs, variant = 'secondary' }: { sourceId: string; songs: number; variant?: 'primary' | 'secondary' }) {
  const [state, formAction, pending] = useActionState<ActionState | null, FormData>(refreshAnalysis, null);
  return (
    <form action={formAction} className="contents">
      <input type="hidden" name="sourceId" value={sourceId} />
      <button type="submit" disabled={pending} className={buttonClass(variant, 'md', 'disabled:cursor-wait disabled:opacity-70')}>
        <SyncGlyph size={16} className={pending ? 'animate-spin' : ''} />
        {pending ? 'Analyzing…' : 'Refresh analysis'}
      </button>
      <div aria-live="polite" className="basis-full empty:hidden">
        {pending ? (
          <p className="m-0 text-[14px] text-text-2">
            {songs ? `Analyzing ${songs.toLocaleString('en-US')} songs…` : 'Reading your songs…'} this can take a minute. Keep this page open.
          </p>
        ) : (
          <ActionMessage state={state} />
        )}
      </div>
    </form>
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
