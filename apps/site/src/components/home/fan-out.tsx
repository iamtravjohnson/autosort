import type { CSSProperties } from 'react';

/**
 * Hero "fan-out" diagram: one tall source playlist fanning out into seven smart playlists.
 * The numbers are a hypothetical example (the caption says so).
 *
 * Motion: the design's signature fan-out (640ms, 40ms stagger, cubic-bezier(.2,.8,.2,1)) runs once
 * on load as plain CSS, and only when the visitor hasn't asked for reduced motion. Without motion the
 * diagram renders in its final state.
 */

const PLAYLISTS = [
  { name: 'Country', count: 412, cover: 'linear-gradient(145deg,#F59E0B,#7C2D12)' },
  { name: '90s Country', count: 96, cover: 'linear-gradient(145deg,#B45309,#451A03)' },
  { name: 'Clean Rap', count: 141, cover: 'linear-gradient(145deg,#38BDF8,#1E3A8A)' },
  { name: 'Worship', count: 88, cover: 'linear-gradient(145deg,#FDE68A,#B45309)' },
  { name: 'Workout', count: 230, cover: 'linear-gradient(145deg,#F97316,#7F1D1D)' },
  { name: 'Happy', count: 318, cover: 'linear-gradient(145deg,#FBBF24,#F472B6)' },
  { name: 'Love Songs', count: 205, cover: 'linear-gradient(145deg,#F472B6,#831843)' },
] as const;

/** Row positions from the board (container is 600×540). */
const TOPS = [30, 100, 170, 240, 310, 380, 450];
const LEFTS = ['50%', '47.3%', '45.6%', '45%', '45.6%', '47.3%', '50%'];
const CONNECTORS = [
  'M204 270 C 260 270, 250 58, 300 58',
  'M204 270 C 260 270, 250 128, 284 128',
  'M204 270 C 260 270, 250 198, 274 198',
  'M204 270 C 240 270, 250 268, 270 268',
  'M204 270 C 260 270, 250 338, 274 338',
  'M204 270 C 260 270, 250 408, 284 408',
  'M204 270 C 260 270, 250 478, 300 478',
];
/** Vertical centre of the source card, where every row starts its fan-out. */
const SOURCE_Y = 270;
const ROW_H = 56;
const SKELETON = [90, 70, 82, 64, 88, 58, 76, 68, 84];

const FAN_CSS = `
@keyframes as-fan-row{from{opacity:0;transform:translate(-70%,var(--fan-dy)) scale(.92)}}
@keyframes as-fan-line{from{stroke-dashoffset:1}}
@media (prefers-reduced-motion:no-preference){
.as-fan-row{animation:as-fan-row 640ms cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(200ms + var(--fan-i) * 40ms)}
.as-fan-line{stroke-dasharray:1;animation:as-fan-line 640ms cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(120ms + var(--fan-i) * 40ms)}
}`;

const total = 2431;
const label = `Example: a Favs playlist of ${total.toLocaleString('en-US')} songs fanning out into seven smart playlists: ${PLAYLISTS.map(
  (p) => `${p.name} ${p.count}`,
).join(', ')}.`;

export function FanOutDiagram() {
  return (
    <figure className="m-0 flex w-full min-w-0 max-w-[600px] flex-[1_1_460px] flex-col gap-3">
      <style href="as-fan-out" precedence="default">
        {FAN_CSS}
      </style>
      <div role="img" aria-label={label} className="relative h-[540px] w-full">
        <svg viewBox="0 0 600 540" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full">
          <g fill="none" stroke="rgba(139,92,246,0.45)" strokeWidth={2}>
            {CONNECTORS.map((d, i) => (
              <path
                key={d}
                d={d}
                pathLength={1}
                className="as-fan-line"
                style={{ '--fan-i': i } as CSSProperties}
              />
            ))}
          </g>
        </svg>

        <div className="absolute left-0 top-10 box-border flex h-[460px] w-[34%] flex-col gap-3 rounded-panel border border-line bg-surface-2 p-3.5 shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
          <div className="grid aspect-square grid-cols-2 overflow-hidden rounded-art">
            <span className="bg-[#4A3B2A]" />
            <span className="bg-[#2F3B4A]" />
            <span className="bg-[#3A2F4A]" />
            <span className="bg-[#4A4530]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[18px] font-extrabold tracking-[-0.02em] sm:text-[22px]">Favs</span>
            <span className="tnum text-[13px] text-text-2">{total.toLocaleString('en-US')} songs</span>
          </div>
          <div className="flex flex-1 flex-col gap-2 overflow-hidden">
            {SKELETON.map((w, i) => (
              <span key={i} className="block h-2 shrink-0 rounded-art bg-surface-3" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>

        {PLAYLISTS.map((p, i) => (
          <div
            key={p.name}
            className="as-fan-row absolute box-border flex h-14 w-1/2 items-center gap-2.5 rounded-card border border-line bg-surface-2 py-2 pl-2 pr-3 shadow-e2 sm:gap-3"
            style={
              {
                left: LEFTS[i],
                top: TOPS[i],
                '--fan-i': i,
                '--fan-dy': `${SOURCE_Y - (TOPS[i]! + ROW_H / 2)}px`,
              } as CSSProperties
            }
          >
            <span className="size-9 shrink-0 rounded-art sm:size-10" style={{ background: p.cover }} />
            <span className="min-w-0 flex-1 truncate text-[14px] font-bold sm:text-[15px]">{p.name}</span>
            <span className="tnum text-[14px] font-semibold text-text-2">{p.count}</span>
          </div>
        ))}
      </div>
      <figcaption className="text-center text-[13px] text-text-3">
        Example only: a hypothetical {total.toLocaleString('en-US')}-song playlist, split seven ways.
      </figcaption>
    </figure>
  );
}
