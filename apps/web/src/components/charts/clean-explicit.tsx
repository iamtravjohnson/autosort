import { EXPLICIT_COLOR } from '@/lib/stats';
import { ChartCard, DataTable, NoData, pct } from './chart-card';

export function CleanExplicit({ clean, explicit }: { clean: number; explicit: number }) {
  const total = clean + explicit;
  const cleanPct = pct(clean, total);
  const explicitPct = total ? 100 - cleanPct : 0;
  return (
    <ChartCard
      id="c-clean"
      title="Clean vs. explicit"
      caption={total ? (explicit === 0 ? 'Every song is clean.' : `${cleanPct}% of your songs are clean.`) : undefined}
      table={
        <DataTable
          caption="Clean and explicit songs"
          columns={['Type', 'Songs', 'Share']}
          numeric={[1, 2]}
          rows={[
            ['Clean', clean, `${cleanPct}%`],
            ['Explicit', explicit, `${explicitPct}%`],
          ]}
        />
      }
    >
      {total === 0 ? (
        <NoData>No songs yet.</NoData>
      ) : (
        <>
          <div className="tnum flex gap-8">
            <div className="flex flex-col">
              <span className="text-[30px] font-extrabold tracking-[-0.02em] sm:text-[36px]">{clean.toLocaleString('en-US')}</span>
              <span className="flex items-center gap-1.5 text-[13px] text-text-2">
                <span className="size-2.5 rounded-[2px] bg-accent" aria-hidden="true" />
                Clean · {cleanPct}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[30px] font-extrabold tracking-[-0.02em] sm:text-[36px]">{explicit.toLocaleString('en-US')}</span>
              <span className="flex items-center gap-1.5 text-[13px] text-text-2">
                <span className="size-2.5 rounded-[2px]" style={{ background: EXPLICIT_COLOR }} aria-hidden="true" />
                Explicit · {explicitPct}%
              </span>
            </div>
          </div>
          <div role="img" aria-label={`${cleanPct} percent clean, ${explicitPct} percent explicit`} className="flex h-5 gap-0.5">
            {clean ? <span title={`Clean · ${clean.toLocaleString('en-US')}`} className="rounded-art bg-accent" style={{ flex: `${clean} 1 0` }} /> : null}
            {explicit ? <span title={`Explicit · ${explicit.toLocaleString('en-US')}`} className="rounded-art" style={{ flex: `${explicit} 1 0`, background: EXPLICIT_COLOR }} /> : null}
          </div>
        </>
      )}
    </ChartCard>
  );
}
