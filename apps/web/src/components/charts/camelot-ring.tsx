import { camelotColors } from '@/components/ui';
import { ChartCard, DataTable, NoData } from './chart-card';

const C = 150;
const OUTER: [number, number] = [104, 148]; // B ring (major)
const INNER: [number, number] = [60, 102]; // A ring (minor)
const GAP = 1.2; // degrees between segments

const KEY_NAMES: Record<string, string> = {
  '1A': 'A♭ minor', '2A': 'E♭ minor', '3A': 'B♭ minor', '4A': 'F minor', '5A': 'C minor', '6A': 'G minor',
  '7A': 'D minor', '8A': 'A minor', '9A': 'E minor', '10A': 'B minor', '11A': 'F♯ minor', '12A': 'D♭ minor',
  '1B': 'B major', '2B': 'F♯ major', '3B': 'D♭ major', '4B': 'A♭ major', '5B': 'E♭ major', '6B': 'B♭ major',
  '7B': 'F major', '8B': 'C major', '9B': 'G major', '10B': 'D major', '11B': 'A major', '12B': 'E major',
};

function point(r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.sin(a), C - r * Math.cos(a)];
}

function segment([r0, r1]: [number, number], center: number): string {
  const a0 = center - 15 + GAP / 2;
  const a1 = center + 15 - GAP / 2;
  const f = (n: number) => n.toFixed(1);
  const [ox0, oy0] = point(r1, a0);
  const [ox1, oy1] = point(r1, a1);
  const [ix1, iy1] = point(r0, a1);
  const [ix0, iy0] = point(r0, a0);
  return `M${f(ox0)} ${f(oy0)}A${r1} ${r1} 0 0 1 ${f(ox1)} ${f(oy1)}L${f(ix1)} ${f(iy1)}A${r0} ${r0} 0 0 0 ${f(ix0)} ${f(iy0)}Z`;
}

function luminance(hex: string, opacity: number, bg = '#1C1C1F'): number {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const mix = [0, 1, 2].map((i) => ch(hex, i) * opacity + ch(bg, i) * (1 - opacity));
  return 0.2126 * lin(mix[0]!) + 0.7152 * lin(mix[1]!) + 0.0722 * lin(mix[2]!);
}

/** Pick the label color with the better contrast on the blended segment color. */
function labelColor(hex: string, opacity: number): string {
  const l = luminance(hex, opacity);
  const onDark = (l + 0.05) / (0.0035 + 0.05);
  const onWhite = 1.05 / (l + 0.05);
  return onDark >= onWhite ? '#0B0B0C' : '#FFFFFF';
}

export function CamelotRing({ keys, top, withKey, songs }: { keys: Record<string, number>; top: { code: string; count: number } | null; withKey: number; songs: number }) {
  const max = Math.max(0, ...Object.values(keys));
  const codes = Array.from({ length: 12 }, (_, i) => i + 1).flatMap((n) => [`${n}B`, `${n}A`]);
  const ranked = Object.entries(keys).sort((a, b) => b[1] - a[1]);
  const least = ranked[ranked.length - 1];
  const label = top
    ? `Camelot key distribution. Most common: ${ranked
        .slice(0, 3)
        .map(([k, v]) => `${k} ${v.toLocaleString('en-US')} songs`)
        .join(', ')}.${least && ranked.length > 3 ? ` Least common: ${least[0]} ${least[1].toLocaleString('en-US')}.` : ''}`
    : 'No key data yet.';

  return (
    <ChartCard
      id="c-key"
      title="Keys on the Camelot wheel"
      caption={top ? `Brighter = more songs. ${top.code} is your most common key.` : undefined}
      table={
        <DataTable
          caption="Songs per Camelot key"
          columns={['Key', 'Musical key', 'Songs']}
          numeric={[2]}
          rows={codes
            .map((k) => [k, KEY_NAMES[k] ?? '', keys[k] ?? 0] as [string, string, number])
            .sort((a, b) => b[2] - a[2])}
        />
      }
    >
      {max === 0 ? (
        <NoData>No key data yet. Keys come from ReccoBeats; refresh the analysis in a little while.</NoData>
      ) : (
        <svg viewBox="0 0 300 300" role="img" aria-label={label} className="tnum mx-auto h-auto w-full max-w-[320px]">
          {codes.map((code) => {
            const n = Number.parseInt(code, 10);
            const minor = code.endsWith('A');
            const ring = minor ? INNER : OUTER;
            const center = (n % 12) * 30;
            const c = keys[code] ?? 0;
            const opacity = c === 0 ? 0.12 : 0.3 + 0.7 * (c / max);
            const color = camelotColors(code).bg;
            const [lx, ly] = point((ring[0] + ring[1]) / 2, center);
            return (
              <g key={code}>
                <path d={segment(ring, center)} fill={color} fillOpacity={opacity}>
                  <title>{`${code} · ${KEY_NAMES[code]} · ${c.toLocaleString('en-US')} ${c === 1 ? 'song' : 'songs'}`}</title>
                </path>
                <text
                  x={lx.toFixed(1)}
                  y={ly.toFixed(1)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={minor ? 12 : 13}
                  fontWeight={700}
                  fill={labelColor(color, opacity)}
                  aria-hidden="true"
                  pointerEvents="none"
                >
                  {code}
                </text>
              </g>
            );
          })}
          {top ? (
            <>
              <text x={C} y={142} textAnchor="middle" fontSize={24} fontWeight={800} fill="#FFFFFF">
                {top.code}
              </text>
              <text x={C} y={164} textAnchor="middle" fontSize={12} fill="#B3B3B8">
                {top.count.toLocaleString('en-US')} {top.count === 1 ? 'song' : 'songs'}
              </text>
            </>
          ) : null}
        </svg>
      )}
      {max > 0 && withKey < songs ? <p className="m-0 text-[12px] text-text-3">{(songs - withKey).toLocaleString('en-US')} songs have no key yet.</p> : null}
    </ChartCard>
  );
}
