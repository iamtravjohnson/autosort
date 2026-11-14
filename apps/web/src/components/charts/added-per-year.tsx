import { ChartCard, DataTable, NoData } from './chart-card';

const X0 = 40;
const X1 = 390;
const Y0 = 20;
const Y1 = 250;

function niceStep(max: number): number {
  const raw = max / 3;
  const pow = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

export function AddedPerYear({ rows }: { rows: Array<{ year: number; count: number }> }) {
  const max = Math.max(0, ...rows.map((r) => r.count));
  const peak = rows.find((r) => r.count === max && max > 0);
  const step = niceStep(max);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks = Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step);
  const x = (i: number) => (rows.length === 1 ? (X0 + X1) / 2 : X0 + (i / (rows.length - 1)) * (X1 - X0));
  const y = (v: number) => Y1 - (v / top) * (Y1 - Y0);
  const line = rows.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(r.count).toFixed(1)}`).join(' ');
  const area = `${line} L${x(rows.length - 1).toFixed(1)} ${Y1} L${x(0).toFixed(1)} ${Y1}Z`;
  const labelEvery = rows.length > 12 ? Math.ceil(rows.length / 10) : 1;
  const summary = rows.map((r) => `${r.year}: ${r.count.toLocaleString('en-US')}`).join(', ');

  return (
    <ChartCard
      id="c-year"
      title="Songs added per year"
      caption={peak ? `You added the most in ${peak.year}: ${peak.count.toLocaleString('en-US')} songs.` : undefined}
      table={<DataTable caption="Songs added per year" columns={['Year', 'Songs added']} numeric={[1]} rows={rows.map((r) => [String(r.year), r.count])} />}
    >
      {max === 0 ? (
        <NoData>No “date added” info for these songs.</NoData>
      ) : (
        <svg viewBox="0 0 400 285" role="img" aria-label={`Songs added per year, ${summary}.`} className="tnum h-auto w-full">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={X0} x2={X1} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.06)" />
              <text x={32} y={y(t)} textAnchor="end" dominantBaseline="central" fontSize={11} fill="#8A8A93">
                {t.toLocaleString('en-US')}
              </text>
            </g>
          ))}
          {rows.length > 1 ? (
            <>
              <path d={area} fill="rgba(139,92,246,0.18)" />
              <path d={line} fill="none" stroke="#8B5CF6" strokeWidth={2} strokeLinejoin="round" />
            </>
          ) : null}
          {rows.map((r, i) => (
            <circle key={r.year} cx={x(i)} cy={y(r.count)} r={rows.length > 1 ? 3 : 5} fill="#8B5CF6" stroke="#1C1C1F" strokeWidth={1.5}>
              <title>{`${r.year} · ${r.count.toLocaleString('en-US')} songs`}</title>
            </circle>
          ))}
          {rows.map((r, i) =>
            i % labelEvery === 0 || i === rows.length - 1 ? (
              <text key={r.year} x={x(i)} y={272} textAnchor="middle" fontSize={11} fill="#8A8A93">
                ’{String(r.year).slice(2)}
              </text>
            ) : null,
          )}
        </svg>
      )}
    </ChartCard>
  );
}
