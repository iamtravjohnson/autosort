'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { addSource } from '@/app/app/sources/new/actions';
import { AnalyzeProgress } from '@/components/analyze/analyze-progress';
import { useAnalyzeAndAutopilot } from '@/components/analyze/use-analyze-and-autopilot';
import type { ActionState } from '@/lib/stats';
import { ActionMessage } from './action-message';
import { ChevronRightGlyph } from './glyphs';

export interface PickerOption {
  value: string;
  name: string;
  meta: string;
  songs: number | null;
  imageUrl: string | null;
  art: string;
  /** Already a source: link to it instead. */
  existingId: string | null;
}

/** The source picker: one tap adds the playlist, reads it, then opens Smart suggestions. */
export function SourcePicker({ options }: { options: PickerOption[] }) {
  const [state, formAction, adding] = useActionState<ActionState | null, FormData>(addSource, null);
  const [picked, setPicked] = useState<PickerOption | null>(null);
  const analysis = useAnalyzeAndAutopilot();
  const router = useRouter();
  const newSourceId = state?.sourceId;
  const { run } = analysis;

  // Once the source is added, analyze it with live progress, then open Smart suggestions.
  useEffect(() => {
    if (!newSourceId) return;
    void run(newSourceId).then(({ ok, created }) => {
      if (ok) router.push(created.length ? '/app/playlists' : `/app/sources/${newSourceId}/suggestions`);
    });
  }, [newSourceId, run, router]);

  const analyzing = analysis.state.status === 'running' || analysis.state.status === 'done';
  const pending = adding || analyzing;
  const failed = analysis.state.status === 'error';

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div aria-live="polite" className="empty:hidden">
        {pending && picked ? (
          <AnalyzeProgress name={picked.name} state={analysis.state} extra={analysis.extra} doneLabel="Creating your smart playlists…" />
        ) : failed && newSourceId ? (
          <ActionMessage
            state={{
              message: `We added ${picked?.name ?? 'your playlist'} but couldn't finish reading it. ${analysis.state.message ?? ''}`.trim(),
              reconnect: analysis.state.reconnect,
              href: `/app/sources/${newSourceId}`,
              hrefLabel: 'Open it and try again',
            }}
          />
        ) : (
          <ActionMessage state={state?.sourceId ? null : state} />
        )}
      </div>
      <ul className="m-0 grid list-none grid-cols-1 gap-2.5 p-0 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] sm:gap-3">
        {options.map((o) => {
          const inner = (
            <>
              <span className="size-14 shrink-0 overflow-hidden rounded-art" style={{ background: o.art }} aria-hidden="true">
                {o.imageUrl ? <Image src={o.imageUrl} alt="" width={56} height={56} unoptimized className="size-full object-cover" /> : null}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[15px] font-bold">{o.name}</span>
                <span className="tnum truncate text-[13px] text-text-2">{o.meta}</span>
              </span>
            </>
          );
          return (
            <li key={o.value}>
              {o.existingId ? (
                <Link
                  href={`/app/sources/${o.existingId}`}
                  className="flex w-full items-center gap-3.5 rounded-card bg-surface-2 p-2.5 text-text-1 no-underline hover:bg-[#222226] hover:text-text-1"
                >
                  {inner}
                  <span className="shrink-0 rounded-pill bg-success/[0.14] px-2.5 py-1 text-[12px] font-bold text-success-text">Added</span>
                </Link>
              ) : (
                <button
                  type="submit"
                  name="pick"
                  value={o.value}
                  disabled={pending}
                  onClick={() => setPicked(o)}
                  aria-label={`Use ${o.name} as a source`}
                  className="flex w-full items-center gap-3.5 rounded-card bg-surface-2 p-2.5 text-left text-text-1 hover:bg-[#222226] disabled:cursor-wait disabled:opacity-60"
                >
                  {inner}
                  {pending && picked?.value === o.value ? (
                    <span className="shrink-0 text-[13px] font-bold text-accent-soft">Analyzing…</span>
                  ) : (
                    <ChevronRightGlyph size={18} className="shrink-0 text-text-2" />
                  )}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </form>
  );
}
