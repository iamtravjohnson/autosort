'use client';

import { useState } from 'react';
import { camelotToKeyName } from '@autosort/core';
import { camelotColors } from '@/components/ui';
import { CamelotChip } from './chip';
import { camelotMoves } from './moves';

const SELECTED_RING = '0 0 0 3px #0B0B0C, 0 0 0 6px #FFFFFF';

interface WheelKey {
  code: string;
  name: string;
  outer: boolean;
  left: string;
  top: string;
}

/** 24 key positions: B (major) on the outer ring, A (minor) inside; 12 at the top, clockwise. */
const KEYS: WheelKey[] = (['B', 'A'] as const).flatMap((letter) =>
  Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const outer = letter === 'B';
    const r = outer ? 41 : 26;
    const th = ((n % 12) * 30 * Math.PI) / 180;
    const code = `${n}${letter}`;
    return {
      code,
      name: camelotToKeyName(code) ?? code,
      outer,
      left: `${(50 + r * Math.sin(th)).toFixed(3)}%`,
      top: `${(50 - r * Math.cos(th)).toFixed(3)}%`,
    };
  }),
);

/**
 * Interactive Camelot wheel. Hovering or clicking a key selects it; keys that don't mix with it
 * (by the design's four moves) dim. Compatibility comes from @autosort/core so it matches the engine.
 */
export function CamelotWheel({ initial = '8A' }: { initial?: string }) {
  const [sel, setSel] = useState(initial);
  const moves = camelotMoves(sel);
  const primary = moves.filter((m) => m.primary);
  const extra = moves.filter((m) => !m.primary);
  const lit = new Set(primary.map((m) => m.code));
  const selName = camelotToKeyName(sel) ?? sel;

  return (
    <section
      id="wheel"
      aria-labelledby="h-wheel"
      className="flex flex-wrap items-center gap-8 rounded-panel bg-surface-1 p-[18px] sm:p-7"
    >
      <h2 id="h-wheel" className="sr-only">
        Interactive Camelot wheel
      </h2>

      <div className="relative aspect-square w-[440px] max-w-full flex-none">
        {KEYS.map((k) => {
          const { bg, fg } = camelotColors(k.code);
          const isSel = k.code === sel;
          return (
            <button
              key={k.code}
              type="button"
              aria-pressed={isSel}
              aria-label={`${k.code}, ${k.name}`}
              onClick={() => setSel(k.code)}
              onMouseEnter={() => setSel(k.code)}
              className={`tnum absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-pill border-0 font-extrabold transition-opacity duration-[120ms] ${
                k.outer ? 'size-11 text-[12px] sm:size-14 sm:text-[14px]' : 'size-[38px] text-[12px] sm:size-[50px] sm:text-[14px]'
              } ${isSel ? 'z-10' : ''}`}
              style={{
                left: k.left,
                top: k.top,
                background: bg,
                color: fg,
                opacity: lit.has(k.code) ? 1 : 0.22,
                boxShadow: isSel ? SELECTED_RING : 'none',
              }}
            >
              {k.code}
            </button>
          );
        })}
        <div
          className="tnum pointer-events-none absolute left-1/2 top-1/2 flex w-[110px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 text-center sm:w-[150px]"
          aria-hidden="true"
        >
          <span className="text-[26px] font-extrabold tracking-[-0.02em] sm:text-[34px]">{sel}</span>
          <span className="text-[14px] text-text-2">{selName}</span>
        </div>
      </div>

      <div className="tnum flex flex-[1_1_240px] flex-col gap-3">
        <h3 className="m-0 text-[13px] font-bold uppercase tracking-[0.06em] text-text-3">Mixes well with {sel}</h3>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {primary.map((m) => (
            <MoveRow key={m.code} code={m.code} name={m.name} why={m.label} />
          ))}
        </ul>
        {extra.length ? (
          <>
            <h4 className="m-0 mt-2 text-[12px] font-bold uppercase tracking-[0.06em] text-text-3">Also allowed by AutoSort</h4>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {extra.map((m) => (
                <MoveRow key={m.code} code={m.code} name={m.name} why={m.label} />
              ))}
            </ul>
          </>
        ) : null}
        <span className="text-[13px] text-text-3">Hover or tap any key.</span>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {`${sel}, ${selName} selected. Mixes well with ${primary
            .filter((m) => m.kind !== 'same')
            .map((m) => m.code)
            .join(', ')}.`}
        </p>
      </div>
    </section>
  );
}

function MoveRow({ code, name, why }: { code: string; name: string; why: string }) {
  return (
    <li className="flex items-center gap-3">
      <CamelotChip code={code} fixed />
      <span className="flex flex-col">
        <span className="text-[15px] font-bold">{name}</span>
        <span className="text-[13px] text-text-2">{why}</span>
      </span>
    </li>
  );
}
