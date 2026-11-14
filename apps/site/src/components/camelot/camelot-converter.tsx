'use client';

import Link from 'next/link';
import { useState } from 'react';
import { camelotToKeyName, camelotToOpenKey, toCamelot } from '@autosort/core';
import { camelotColors } from '@/components/ui';
import { CamelotChip } from './chip';
import { camelotMoves } from './moves';

/** Note buttons by pitch class (0 = C … 11 = B), as on the board. */
const NOTES = ['C', 'C♯ / D♭', 'D', 'D♯ / E♭', 'E', 'F', 'F♯ / G♭', 'G', 'G♯ / A♭', 'A', 'A♯ / B♭', 'B'];
const MODES = [
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
] as const;
type Mode = (typeof MODES)[number]['value'];

const radioFocus = 'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent';

/**
 * Musical key → Camelot + Open Key converter. Uses real radio inputs (arrow keys work) styled as
 * the board's segmented control and note grid. Conversion comes from @autosort/core.
 */
export function CamelotConverter() {
  const [note, setNote] = useState(9);
  const [mode, setMode] = useState<Mode>('minor');

  const code = toCamelot(note, mode === 'major' ? 1 : 0) ?? '8A';
  const name = camelotToKeyName(code) ?? code;
  const openKey = camelotToOpenKey(code);
  const { bg, fg } = camelotColors(code);
  const mixes = camelotMoves(code).filter((m) => m.primary && m.kind !== 'same');

  // When the picked note is a sharp/flat pair, mention the spelling the engine didn't use.
  const spellings = (NOTES[note] ?? '').split(' / ');
  const alt = spellings.length > 1 ? spellings.find((s) => !name.startsWith(`${s} `)) : undefined;

  return (
    <section aria-label="Converter" className="flex flex-wrap gap-6 rounded-panel bg-surface-1 p-[18px] sm:p-7">
      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-[18px]">
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="sr-only">Mode</legend>
          <div className="inline-flex rounded-pill bg-surface-3 p-1">
            {MODES.map((m) => (
              <label key={m.value} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="camelot-mode"
                  value={m.value}
                  checked={mode === m.value}
                  onChange={() => setMode(m.value)}
                  className="peer sr-only"
                />
                <span
                  className={`flex h-10 items-center rounded-pill px-5 text-[14px] font-bold text-text-2 transition-colors duration-[120ms] peer-checked:bg-white peer-checked:text-bg ${radioFocus}`}
                >
                  {m.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="sr-only">Root note</legend>
          <div className="grid grid-cols-4 gap-2">
            {NOTES.map((label, i) => (
              <label key={label} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="camelot-note"
                  value={i}
                  checked={note === i}
                  onChange={() => setNote(i)}
                  className="peer sr-only"
                />
                <span
                  className={`flex h-[52px] items-center justify-center rounded-card bg-surface-3 px-1 text-center text-[15px] font-bold text-text-1 transition-colors duration-[120ms] peer-checked:bg-accent peer-checked:text-bg sm:text-[16px] ${radioFocus}`}
                >
                  {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="tnum flex min-w-0 flex-[1_1_300px] flex-col gap-4 rounded-card bg-surface-2 p-[22px]">
        <span className="text-[13px] text-text-2">
          {name}
          {alt ? <span className="text-text-3"> · also written {`${alt} ${mode}`}</span> : null}
        </span>
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex size-24 shrink-0 items-center justify-center rounded-pill text-[34px] font-extrabold"
            style={{ background: bg, color: fg }}
          >
            {code}
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-[13px] text-text-3">Camelot</span>
            <span className="text-[28px] font-extrabold leading-none">{code}</span>
            <span className="text-[14px] text-text-2">Open Key {openKey}</span>
          </span>
        </div>
        <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-3">Mixes well with</span>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {mixes.map((m) => (
            <li key={m.code}>
              <CamelotChip code={m.code} title={`${m.name}: ${m.label}`}>
                <span className="sr-only">{`, ${m.name}, ${m.label}`}</span>
              </CamelotChip>
            </li>
          ))}
        </ul>
        <Link href="/guides/camelot-wheel" className="text-[14px] font-bold">
          How the wheel works →
        </Link>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {`${name} is ${code} in Camelot and ${openKey} in Open Key.`}
        </p>
      </div>
    </section>
  );
}
