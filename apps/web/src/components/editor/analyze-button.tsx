'use client';

import { useRouter } from 'next/navigation';
import { AnalyzeProgress } from '@/components/analyze/analyze-progress';
import { useAnalyzeAndAutopilot } from '@/components/analyze/use-analyze-and-autopilot';
import { buttonClass } from '@/components/ui';

/** "Analyze this playlist first": reads the source and looks up its songs, with live progress. */
export function AnalyzeButton({ sourceId, sourceName }: { sourceId: string; sourceName: string }) {
  const { state, extra, run } = useAnalyzeAndAutopilot();
  const router = useRouter();
  if (state.status === 'running' || state.status === 'done') {
    return <AnalyzeProgress name={sourceName} state={state} extra={extra} doneLabel="Creating your smart playlists…" />;
  }
  return (
    <div className="flex flex-col items-start gap-3">
      <button type="button" onClick={() => void run(sourceId).then(({ ok, created }) => (ok ? (created.length ? router.push('/app/playlists') : router.refresh()) : null))} className={buttonClass('primary', 'md')}>
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
