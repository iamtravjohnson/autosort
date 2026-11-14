import Link from 'next/link';
import { camelotToKeyName } from '@autosort/core';
import { CAMELOT_A, CAMELOT_B } from '@/components/ui';

/**
 * Static Camelot wheel for the home page (no script): a 300×300 donut with the B (major) ring outside
 * and the A (minor) ring inside, one key selected and the keys that mix with it lit up. The whole
 * wheel links to the interactive guide.
 */

const C = 150;
const RING = {
  B: { outer: 148, inner: 104, label: 126, size: 13, text: '#0B0B0C', colors: CAMELOT_B },
  A: { outer: 102, inner: 60, label: 81, size: 12, text: '#FFFFFF', colors: CAMELOT_A },
} as const;
/** Each segment spans 30° minus a 1° gap on both sides. */
const HALF = 14;

const f = (n: number) => n.toFixed(1);
/** Polar → SVG coordinates; 0° is 12 o'clock, clockwise. */
function xy(r: number, deg: number): [string, string] {
  const a = (deg * Math.PI) / 180;
  return [f(C + r * Math.sin(a)), f(C - r * Math.cos(a))];
}
const point = (r: number, deg: number) => xy(r, deg).join(' ');
function segment(outer: number, inner: number, center: number): string {
  const a0 = center - HALF;
  const a1 = center + HALF;
  return `M${point(outer, a0)}A${outer} ${outer} 0 0 1 ${point(outer, a1)}L${point(inner, a1)}A${inner} ${inner} 0 0 0 ${point(inner, a0)}Z`;
}

/** Keys that mix with `code`: neighbours on the same ring, the relative key, and +2 for an energy boost. */
function mixesWith(n: number, letter: 'A' | 'B'): string[] {
  const wrap = (x: number) => ((x - 1 + 12) % 12) + 1;
  return [`${wrap(n - 1)}${letter}`, `${wrap(n + 1)}${letter}`, `${n}${letter === 'A' ? 'B' : 'A'}`, `${wrap(n + 2)}${letter}`];
}

export function StaticCamelotWheel({ selected = '8A' }: { selected?: string }) {
  const m = /^(\d{1,2})([AB])$/.exec(selected);
  const n = m ? Number(m[1]) : 8;
  const letter = (m?.[2] ?? 'A') as 'A' | 'B';
  const lit = new Set([selected, ...mixesWith(n, letter)]);
  const keyName = camelotToKeyName(selected) ?? '';
  const partners = mixesWith(n, letter);
  const ariaLabel = `Open the Camelot wheel guide. The wheel shows ${selected} (${keyName}), which mixes with ${partners.slice(0, 3).join(', ')}, and ${partners[3]} for an energy boost.`;

  // Draw the selected key last so its white outline sits on top of its neighbours.
  const keys = (['B', 'A'] as const)
    .flatMap((ring) => Array.from({ length: 12 }, (_, i) => ({ ring, i, code: `${i + 1}${ring}` })))
    .sort((a, b) => Number(a.code === selected) - Number(b.code === selected));

  return (
    <Link
      href="/guides/camelot-wheel"
      aria-label={ariaLabel}
      className="block w-full max-w-[380px] rounded-pill transition-transform duration-200 ease-out-expo hover:scale-[1.02]"
    >
      <svg viewBox="0 0 300 300" aria-hidden="true" className="block w-full font-sans">
        {keys.map(({ ring, i, code }) => {
          const spec = RING[ring];
          const angle = ((i + 1) % 12) * 30;
          const on = lit.has(code);
          const [x, y] = xy(spec.label, angle);
          return (
            <g key={code}>
              <path
                d={segment(spec.outer, spec.inner, angle)}
                fill={spec.colors[i]}
                opacity={on ? 1 : 0.18}
                {...(code === selected ? { stroke: '#FFFFFF', strokeWidth: 3 } : {})}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={spec.size}
                fontWeight={700}
                fill={spec.text}
                opacity={on ? 1 : 0.5}
              >
                {code}
              </text>
            </g>
          );
        })}
        <circle cx={C} cy={C} r={56} fill="#0B0B0C" />
        <text x={C} y={142} textAnchor="middle" fontSize={26} fontWeight={800} fill="#FFFFFF">
          {selected}
        </text>
        <text x={C} y={166} textAnchor="middle" fontSize={12} fill="#B3B3B8">
          {keyName}
        </text>
      </svg>
    </Link>
  );
}
