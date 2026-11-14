'use client';

import { useRouter } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';
import { setAutopilot } from '@/app/app/sources/[id]/actions';

/** Autopilot on/off for a source: create the smart playlists AutoSort recommends, now and as the library grows. */
export function AutopilotToggle({ sourceId, sourceName, on }: { sourceId: string; sourceName: string; on: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, setValue] = useOptimistic(on);
  const toggle = () =>
    start(async () => {
      setValue(!value);
      await setAutopilot(sourceId, !value);
      router.refresh();
    });
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card bg-surface-2 px-4 py-3.5">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label="Autopilot"
        onClick={toggle}
        disabled={pending}
        className={`relative h-7 w-12 shrink-0 rounded-pill transition-colors ${value ? 'bg-accent' : 'bg-surface-3'}`}
      >
        <span className={`absolute top-1 size-5 rounded-pill bg-white transition-[left] ${value ? 'left-6' : 'left-1'}`} />
      </button>
      <span className="flex min-w-0 flex-1 basis-[260px] flex-col gap-0.5">
        <span className="text-[15px] font-bold">Autopilot {value ? 'is on' : 'is off'}</span>
        <span className="text-[13px] leading-[1.5] text-text-2">
          {value
            ? `AutoSort creates every smart playlist it recommends for ${sourceName}, and new ones as your library grows. Delete one and it won't come back.`
            : `AutoSort only suggests playlists for ${sourceName}; you pick which to create.`}
        </span>
      </span>
    </div>
  );
}
