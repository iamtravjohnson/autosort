'use client';

import { useRouter } from 'next/navigation';
import { useOptimistic, useState, useTransition } from 'react';
import { setCoverStyle, switchToAlbumMosaics } from '@/app/app/settings/actions';
import { Spinner } from '@/components/editor/bits';
import { buttonClass } from '@/components/ui';

type Style = 'mosaic' | 'photo' | 'designed';

const OPTIONS: Array<{ value: Style; label: string; body: string }> = [
  { value: 'mosaic', label: 'Album mosaic', body: 'Spotify makes the cover from four album covers in the playlist, and it updates as songs change. Free.' },
  { value: 'photo', label: 'Photo', body: 'A photo picked for the playlist, with its name. About $0.13 each with your OpenRouter key.' },
  { value: 'designed', label: 'Designed', body: 'The playlist’s color with its name in bold type. Free.' },
];

/** Settings → Playlist covers: pick a style; switching to album mosaics can rebuild existing playlists. */
export function CoverStyleSettings({ style, photoAvailable, customCovers }: { style: Style; photoAvailable: boolean; customCovers: number }) {
  const router = useRouter();
  const [value, setValue] = useOptimistic(style);
  const [saving, startSaving] = useTransition();
  const [rebuilding, startRebuild] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const choose = (next: Style) =>
    startSaving(async () => {
      setValue(next);
      setMessage(null);
      await setCoverStyle(next);
      router.refresh();
    });

  const rebuild = () =>
    startRebuild(async () => {
      setMessage(null);
      const res = await switchToAlbumMosaics();
      setConfirming(false);
      setMessage(
        res.ok
          ? { tone: 'ok', text: res.rebuilt ? `Rebuilt ${res.rebuilt} playlist${res.rebuilt === 1 ? '' : 's'}. Spotify can take a minute to show the mosaics.` : 'Your playlists already use album mosaics.' }
          : { tone: 'error', text: res.error ?? 'Something went wrong. Try again.' },
      );
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Cover style" className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((o) => {
          const disabled = o.value === 'photo' && !photoAvailable;
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled || saving || rebuilding}
              onClick={() => choose(o.value)}
              className={`flex flex-col gap-1 rounded-card border p-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${on ? 'border-accent bg-accent/10' : 'border-line hover:border-white/25'}`}
            >
              <span className="text-[15px] font-bold">{o.label}</span>
              <span className="text-[13px] leading-[1.5] text-text-2">{disabled ? 'Add OPENROUTER_API_KEY in Vercel to use photos.' : o.body}</span>
            </button>
          );
        })}
      </div>

      {value === 'mosaic' && customCovers > 0 ? (
        rebuilding ? (
          <span role="status" className="inline-flex items-center gap-2 text-[14px] text-text-2">
            <Spinner className="text-accent-soft" />
            Rebuilding {customCovers} playlists… this takes a minute or two.
          </span>
        ) : confirming ? (
          <div className="flex flex-col gap-2.5 rounded-card bg-surface-3 p-3.5 text-[14px]">
            <span>
              Spotify doesn’t let apps remove a cover, so AutoSort makes a fresh copy of each of your {customCovers} playlists with the same songs, then
              removes the old one from your library. Anyone following the old ones would need to follow the new copies.
            </span>
            <span className="flex flex-wrap gap-2">
              <button type="button" onClick={rebuild} className={buttonClass('primary', 'sm')}>
                Rebuild with album mosaics
              </button>
              <button type="button" onClick={() => setConfirming(false)} className={buttonClass('secondary', 'sm')}>
                Cancel
              </button>
            </span>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className={buttonClass('secondary', 'sm', 'self-start')}>
            Switch my {customCovers} playlists to album mosaics
          </button>
        )
      ) : null}

      {message ? (
        <p role={message.tone === 'error' ? 'alert' : 'status'} className={`m-0 text-[13px] ${message.tone === 'error' ? 'text-error-text' : 'text-success-text'}`}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
