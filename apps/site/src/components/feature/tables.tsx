import type { ReactNode } from 'react';
import { camelotToKeyName, camelotToOpenKey, transition } from '@autosort/core';
import { KeyChip, TransitionChip } from '@/components/ui';
import type { BeforeAfterExample, ReferenceTable as ReferenceTableData, TrackRow, WhereExample } from '@/content/features';
import { StartChip } from './hero-visual';

/** Horizontal scroll wrapper for wide tables; focusable so keyboard users can scroll it. */
function Scroller({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className={`overflow-x-auto rounded-card border border-line ${className}`}>
      {children}
    </div>
  );
}

/** Split pages: "Where each song goes". */
export function WhereTable({ example }: { example: WhereExample }) {
  return (
    <Scroller label={example.caption}>
      <table className="w-full min-w-[720px] border-collapse text-[15px]">
        <caption className="sr-only">{example.caption}</caption>
        <thead>
          <tr className="bg-surface-2 text-left">
            <th scope="col" className="px-4 py-3 font-bold">
              {example.songColumn ?? 'Song'}
            </th>
            {example.columns.map((c) => (
              <th key={c} scope="col" className="px-4 py-3 font-bold">
                {c}
              </th>
            ))}
            <th scope="col" className="px-4 py-3 font-bold">
              Goes to
            </th>
          </tr>
        </thead>
        <tbody>
          {example.rows.map((r) => (
            <tr key={r.song} className="border-t border-line">
              <th scope="row" className="px-4 py-3 text-left font-normal">
                <strong className="font-bold">{r.song}</strong>
                <br />
                <span className="text-[13px] text-text-3">{r.artist}</span>
              </th>
              {r.cells.map((c, i) => (
                <td key={i} className="tnum px-4 py-3 text-text-2">
                  {c}
                </td>
              ))}
              <td className="px-4 py-3 font-semibold">{r.to}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Scroller>
  );
}

function KeyValue({ code, detail }: { code: string; detail?: 'name' | 'openKey' }) {
  const text = detail === 'name' ? camelotToKeyName(code) : detail === 'openKey' ? camelotToOpenKey(code) : null;
  return (
    <span className="inline-flex items-center justify-end gap-2">
      {text ? <span className="whitespace-nowrap text-[12px] font-normal text-text-3">{text}</span> : null}
      <KeyChip code={code} size="sm" />
    </span>
  );
}

function OrderTable({ example, caption, rows }: { example: BeforeAfterExample; caption: string; rows: TrackRow[] }) {
  const isKey = example.valueType === 'key';
  const showTransitions = isKey && example.transitions;
  return (
    <Scroller label={caption} className="min-w-0 flex-[1_1_420px]">
      <table className={`tnum w-full border-collapse text-[14px] ${showTransitions ? 'min-w-[460px]' : ''}`}>
        <caption className="bg-surface-2 px-4 py-3 text-left text-[15px] font-bold">{caption}</caption>
        <thead>
          <tr className="text-left text-[12px] uppercase tracking-[0.06em] text-text-3">
            <th scope="col" className="px-4 py-2.5 font-semibold">
              #
            </th>
            <th scope="col" className="px-4 py-2.5 font-semibold">
              Track
            </th>
            <th scope="col" className="px-4 py-2.5 text-right font-semibold">
              {example.valueLabel}
            </th>
            {showTransitions ? (
              <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                Transition
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const prev = rows[i - 1];
            return (
              <tr key={r.title} className="border-t border-line">
                <td className="px-4 py-2.5 text-text-3">{i + 1}</td>
                <td className="px-4 py-2.5">
                  <span className="block">{r.title}</span>
                  <span className={`block text-[12px] ${r.note ? 'text-accent-soft' : 'text-text-3'}`}>{r.note ?? r.artist}</span>
                </td>
                <td className="px-4 py-2.5 text-right font-bold">{isKey ? <KeyValue code={r.value} detail={example.keyDetail} /> : r.value}</td>
                {showTransitions ? (
                  <td className="px-4 py-2.5 text-right">{prev ? <TransitionChip kind={transition(prev.value, r.value)} /> : <StartChip />}</td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Scroller>
  );
}

/** Sort pages: original order next to the sorted order. */
export function BeforeAfterTables({ example }: { example: BeforeAfterExample }) {
  return (
    <div className="flex flex-wrap gap-5">
      <OrderTable example={example} caption={example.before.caption} rows={example.before.rows} />
      <OrderTable example={example} caption={example.after.caption} rows={example.after.rows} />
    </div>
  );
}

/** Reference table: typical BPM ranges, mood rules, energy shapes. */
export function ReferenceTable({ table }: { table: ReferenceTableData }) {
  return (
    <Scroller label={table.caption}>
      <table className="tnum w-full min-w-[560px] border-collapse text-[15px]">
        <caption className="sr-only">{table.caption}</caption>
        <thead>
          <tr className="bg-surface-2 text-left">
            {table.columns.map((c) => (
              <th key={c} scope="col" className="px-4 py-3 font-bold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map(([label, value, setting]) => (
            <tr key={label} className="border-t border-line">
              <th scope="row" className="px-4 py-3 text-left font-bold">
                {label}
              </th>
              <td className="px-4 py-3 text-text-2">{value}</td>
              <td className="px-4 py-3">
                {table.lastColumnChip ? (
                  <span className="inline-block whitespace-nowrap rounded-pill bg-surface-3 px-2.5 py-[3px] text-[13px] font-semibold">{setting}</span>
                ) : (
                  <span className="text-text-2">{setting}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Scroller>
  );
}
