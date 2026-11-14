'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { regenerateAllCovers } from '@/app/app/playlists/actions';
import { buttonClass } from '@/components/ui';
import { Spinner } from './bits';

/** "New covers for all": replaces every smart playlist's cover in Spotify, after a confirm step. */
export function NewCoversButton({ count, photos }: { count: number; photos: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [pending, start] = useTransition();
  const cost = photos ? ` That’s about $${(count * 0.13).toFixed(2)} with your OpenRouter key.` : '';

  const run = () =>
    start(async () => {
      setMessage(null);
      const res = await regenerateAllCovers();
      setConfirming(false);
      setMessage(
        res.ok
          ? { tone: 'ok', text: `Made ${res.made ?? count} new cover${res.made === 1 ? '' : 's'}. Spotify can take a minute to show them.` }
          : { tone: 'error', text: res.error ?? 'Something went wrong. Try again.' },
      );
      router.refresh();
    });

  if (pending) {
    return (
      <span role="status" className="inline-flex items-center gap-2 text-[14px] text-text-2">
        <Spinner className="text-accent-soft" />
        Making {count} {photos ? 'photo ' : ''}covers… this takes a minute or two.
      </span>
    );
  }
  return (
    <div className="flex flex-col items-start gap-2">
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2.5 rounded-card bg-surface-2 px-3.5 py-2.5 text-[14px]">
          <span>
            Replace the covers of all {count} playlists in Spotify?{cost}
          </span>
          <button type="button" onClick={run} className={buttonClass('primary', 'sm')}>
            Make new covers
          </button>
          <button type="button" onClick={() => setConfirming(false)} className={buttonClass('secondary', 'sm')}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className={buttonClass('secondary', 'sm')}>
          {photos ? 'New photo covers for all' : 'New covers for all'}
        </button>
      )}
      {message ? (
        <p role={message.tone === 'error' ? 'alert' : 'status'} className={`m-0 text-[13px] ${message.tone === 'error' ? 'text-error-text' : 'text-success-text'}`}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
