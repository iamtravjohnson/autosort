'use client';

import { useRouter } from 'next/navigation';
import { AnalyzeProgress } from '@/components/analyze/analyze-progress';
import { useAnalysis } from '@/components/analyze/use-analysis';
import { buttonClass } from '@/components/ui';

/** "Analyze this playlist first": reads the source and looks up its songs, with live progress. */
export function AnalyzeButton({ sourceId, sourceName }: { sourceId: string; sourceName: string }) {
  const { state, run } = useAnalysis();
  const router = useRouter();
  if (state.status === 'running' || state.status === 'done') {
    return <AnalyzeProgress name={sourceName} state={state} doneLabel="Loading your smart suggestions…" />;
  }
  return (
    <div className="flex flex-col items-start gap-3">
      <button type="button" onClick={() => void run(sourceId).then((ok) => ok && router.refresh())} className={buttonClass('primary', 'md')}>
        {state.status === 'error' ? 'Try again' : 'Analyze this playlist first'}
      </button>
      {state.status === 'error' ? (
        <p role="alert" className="m-0 text-[14px] text-error-text">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
