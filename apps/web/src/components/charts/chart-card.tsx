import type { ReactNode } from 'react';

/** A chart panel: heading, one-line takeaway, the chart, and a "Show as table" fallback. */
export function ChartCard({ id, title, caption, children, table }: { id: string; title: string; caption?: ReactNode; children: ReactNode; table: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-3.5 rounded-card bg-surface-2 p-3.5 sm:p-5">
      <div className="flex flex-col gap-0.5">
        <h3 id={id} className="m-0 text-[15px] font-bold sm:text-[17px]">
          {title}
        </h3>
        {caption ? <p className="m-0 text-[13px] leading-[1.45] text-text-2">{caption}</p> : null}
      </div>
      {children}
      <details className="group mt-auto text-[13px]">
        <summary className="w-fit font-bold text-accent-hover hover:text-accent-soft">
          <span className="group-open:hidden">Show as table</span>
          <span className="hidden group-open:inline">Hide table</span>
        </summary>
        <div className="mt-3 max-h-[320px] overflow-auto">{table}</div>
      </details>
    </section>
  );
}

/** Plain data table for chart fallbacks. Numeric columns are right-aligned with tabular numbers. */
export function DataTable({ caption, columns, rows, numeric = [] }: { caption: string; columns: string[]; rows: Array<Array<string | number>>; numeric?: number[] }) {
  return (
    <table className="tnum w-full border-collapse text-left text-[14px] text-text-2">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-line">
          {columns.map((c, i) => (
            <th key={c} scope="col" className={`py-2 pr-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3 ${numeric.includes(i) ? 'text-right' : ''}`}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri} className="border-b border-line last:border-0">
            {r.map((cell, ci) =>
              ci === 0 ? (
                <th key={ci} scope="row" className="py-1.5 pr-3 font-semibold text-text-1">
                  {cell}
                </th>
              ) : (
                <td key={ci} className={`py-1.5 pr-3 ${numeric.includes(ci) ? 'text-right' : ''}`}>
                  {typeof cell === 'number' ? cell.toLocaleString('en-US') : cell}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Shown in a chart's place when there's nothing to draw yet. */
export function NoData({ children }: { children: ReactNode }) {
  return <p className="m-0 flex min-h-[160px] items-center justify-center rounded-sm bg-[#18181B] px-6 text-center text-[14px] text-text-2">{children}</p>;
}

export const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);
