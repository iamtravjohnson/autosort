import { QUADRANTS, type Quadrant, type SourceStats } from '@/lib/stats';
import { ChartCard, DataTable, NoData, pct } from './chart-card';

// Plot area inside a 400×300 viewBox.
const X0 = 40;
const X1 = 390;
const Y0 = 20;
const Y1 = 270;
const ORDER: Quadrant[] = ['happy', 'intense', 'chill', 'sad'];

export function MoodScatter({ mood }: { mood: SourceStats['mood'] }) {
  const { points, counts, total, every } = mood;
  const n = (q: Quadrant) => counts[q].toLocaleString('en-US');
  const caption = total === 0 ? undefined : every > 1 ? `Each dot stands for about ${every} songs.` : 'Each dot is one song.';
  const x = (valence: number) => X0 + valence * (X1 - X0);
  const y = (energy: number) => Y1 - energy * (Y1 - Y0);
  const label = `Energy by mood scatter. ${ORDER.map((q) => `${QUADRANTS[q].label} ${n(q)} songs`).join(', ')}.`;

  return (
    <ChartCard
      id="c-mood"
      title="Energy × mood"
      caption={caption}
      table={
        <DataTable
          caption="Songs per mood quadrant"
          columns={['Quadrant', 'Where', 'Songs', 'Share']}
          numeric={[2, 3]}
          rows={ORDER.map((q) => [QUADRANTS[q].label, QUADRANTS[q].where, counts[q], `${pct(counts[q], total)}%`])}
        />
      }
    >
      {total === 0 ? (
        <NoData>No energy or mood data yet. Refresh the analysis in a little while.</NoData>
      ) : (
        <>
          <svg viewBox="0 0 400 300" role="img" aria-label={label} className="tnum h-auto w-full">
            <line x1={x(0.5)} x2={x(0.5)} y1={Y0} y2={Y1} stroke="rgba(255,255,255,0.14)" strokeDasharray="4 4" />
            <line x1={X0} x2={X1} y1={y(0.5)} y2={y(0.5)} stroke="rgba(255,255,255,0.14)" strokeDasharray="4 4" />
            {points.map((p, i) => (
              <circle key={i} cx={x(p.valence)} cy={y(p.energy)} r={4.5} fill={QUADRANTS[p.q].color} stroke="#1C1C1F" strokeWidth={2}>
                <title>{p.name}</title>
              </circle>
            ))}
            <g fontWeight={700} fill="#FFFFFF" className="text-[16px] sm:text-[13px]" style={{ paintOrder: 'stroke' }} stroke="#1C1C1F" strokeWidth={4} strokeLinejoin="round">
              <text x={384} y={36} textAnchor="end">
                {QUADRANTS.happy.label} · {n('happy')}
              </text>
              <text x={46} y={36}>
                {QUADRANTS.intense.label} · {n('intense')}
              </text>
              <text x={384} y={262} textAnchor="end">
                {QUADRANTS.chill.label} · {n('chill')}
              </text>
              <text x={46} y={262}>
                {QUADRANTS.sad.label} · {n('sad')}
              </text>
            </g>
            <text x={x(0.5)} y={292} textAnchor="middle" fontSize={11} fill="#8A8A93">
              Sadder ← mood → happier
            </text>
            <text x={14} y={y(0.5)} textAnchor="middle" fontSize={11} fill="#8A8A93" transform={`rotate(-90 14 ${y(0.5)})`}>
              Energy
            </text>
          </svg>
          <ul className="m-0 flex list-none flex-wrap gap-x-3.5 gap-y-1.5 p-0 text-[13px] text-text-2">
            {ORDER.map((q) => (
              <li key={q} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-pill" style={{ background: QUADRANTS[q].color }} aria-hidden="true" />
                {QUADRANTS[q].label}
              </li>
            ))}
          </ul>
        </>
      )}
    </ChartCard>
  );
}
