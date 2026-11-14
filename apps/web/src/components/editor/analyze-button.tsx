'use client';

import { startTransition, useActionState } from 'react';
import { analyzeSourceNow } from '@/app/app/sources/[id]/suggestions/actions';
import { buttonClass } from '@/components/ui';
import { ActionNotice, Spinner } from './bits';

/** "Analyze this playlist first": reads the source and looks up its songs (can take a minute). */
export function AnalyzeButton({ sourceId, sourceName }: { sourceId: string; sourceName: string }) {
  const [state, analyze, pending] = useActionState(analyzeSourceNow, null);
  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => analyze(sourceId))}
        className={`${buttonClass('primary', 'md')} disabled:cursor-wait disabled:opacity-80`}
      >
        {pending ? <Spinner /> : null}
        {pending ? 'Analyzing…' : 'Analyze this playlist first'}
      </button>
      <p role="status" aria-live="polite" className="m-0 text-[14px] text-text-2">
        {pending ? `Reading ${sourceName} and looking up each song… this can take a minute.` : ''}
      </p>
      <ActionNotice result={state} />
    </div>
  );
}
