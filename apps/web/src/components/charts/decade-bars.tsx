import { ChartCard, DataTable, NoData } from './chart-card';

type Row = { decade: number; label: string; count: number };

export function DecadeBars({ decades, songs }: { decades: Row[]; songs: number }) {
  const max = Math.max(0, ...decades.map((d) => d.count));
  const top = decades.find((d) => d.count === max && max > 0);
  const known = decades.reduce((n, d) => n + d.count, 0);
  const caption = top ? `Mostly the ${top.label}.${songs - known > 0 ? ` ${(songs - known).toLocaleString('en-US')} songs have no year yet.` : ''}` : undefined;
  const summary = decades.map((d) => `${d.label} ${d.count.toLocaleString('en-US')}`).join(', ');

  return (
    <ChartCard
      id="c-decade"
      title="Songs by decade"
      caption={caption}
      table={<DataTable caption="Songs by decade" columns={['Decade', 'Songs']} numeric={[1]} rows={decades.map((d) => [`${d.decade}s`, d.count])} />}
    >
      {max === 0 ? (
        <NoData>No release years yet. Refresh the analysis in a little while.</NoData>
      ) : (
        <>
          {/* Phone: horizontal bars */}
          <div role="img" aria-label={`Songs by decade: ${summary}`} className="tnum flex flex-col gap-2 sm:hidden">
            {decades.map((d) => (
              <div key={d.decade} className="grid grid-cols-[40px_1fr_44px] items-center gap-2.5 text-[12px]">
                <span className="text-text-3">{d.label}</span>
                <span className="h-3.5 rounded-r-art bg-accent" style={{ width: `${(d.count / max) * 100}%`, minWidth: d.count ? 2 : 0 }} />
                <span className={`text-right font-bold ${d.count === max ? 'text-text-1' : 'text-text-3'}`}>{d.count.toLocaleString('en-US')}</span>
              </div>
            ))}
          </div>
          {/* Wider screens: columns */}
          <div className="hidden sm:block">
            <div role="img" aria-label={`Songs by decade: ${summary}`} className="tnum flex h-[260px] items-end gap-2.5 border-b border-white/12 px-1 lg:gap-3.5">
              {decades.map((d) => (
                <div key={d.decade} title={`${d.label} · ${d.count.toLocaleString('en-US')} songs`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                  <span className={`text-[12px] font-bold ${d.count === max ? 'text-text-1' : 'text-text-3'}`}>{d.count.toLocaleString('en-US')}</span>
                  <span className="w-full max-w-11 rounded-t-art bg-accent" style={{ height: `${(d.count / max) * 210}px` }} />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex gap-2.5 px-1 lg:gap-3.5" aria-hidden="true">
              {decades.map((d) => (
                <span key={d.decade} className="min-w-0 flex-1 text-center text-[12px] text-text-3">
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </ChartCard>
  );
}
