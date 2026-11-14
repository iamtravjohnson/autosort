'use client';

import { useActionState } from 'react';
import { syncNow } from '@/app/app/actions';
import { buttonClass } from '@/components/ui';
import type { ActionState } from '@/lib/stats';
import { ActionMessage } from './action-message';
import { SyncGlyph } from './glyphs';

/** "Sync now": runs a manual sync with a pending state and a result line. */
export function SyncNowButton() {
  const [state, formAction, pending] = useActionState<ActionState | null, FormData>(syncNow, null);
  return (
    <form action={formAction} className="contents">
      <button type="submit" disabled={pending} aria-describedby="sync-now-status" className={buttonClass('secondary', 'sm', 'disabled:cursor-wait disabled:opacity-70')}>
        <SyncGlyph size={16} className={pending ? 'animate-spin' : ''} />
        {pending ? 'Syncing…' : 'Sync now'}
      </button>
      <div id="sync-now-status" aria-live="polite" className="basis-full empty:hidden">
        {pending ? <p className="m-0 text-[14px] text-text-2">Syncing your smart playlists with Spotify… this can take a minute.</p> : <ActionMessage state={state} />}
      </div>
    </form>
  );
}
