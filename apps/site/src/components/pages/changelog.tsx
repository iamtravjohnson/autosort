import { CHANGE_TAG_STYLE, type ChangeKind, type Release } from '@/content/changelog';
import { formatDate } from '@/lib/site';

/** New / Improved / Fixed pill (76px wide, 11/700). */
export function ChangeTag({ kind }: { kind: ChangeKind }) {
  const s = CHANGE_TAG_STYLE[kind];
  return (
    <span className="w-[76px] flex-none rounded-pill py-0.5 text-center text-[11px] font-bold" style={{ background: s.bg, color: s.fg }}>
      {kind}
    </span>
  );
}

/** One release row: version + date on the left, title and tagged items on the right. */
export function ReleaseEntry({ r }: { r: Release }) {
  return (
    <li id={r.id} className="flex scroll-mt-24 flex-wrap gap-6 border-t border-line py-7">
      <div className="tnum flex flex-[0_0_160px] flex-col gap-1.5">
        <span className="text-[22px] font-extrabold">{r.version}</span>
        <time dateTime={r.date} className="text-[13px] text-text-3">
          {formatDate(r.date)}
        </time>
        <span className="flex flex-wrap gap-1.5">
          <span className="rounded-pill bg-surface-3 px-[9px] py-[3px] text-[12px] font-bold text-text-2">{r.product}</span>
          {r.latest ? <span className="rounded-pill bg-accent-tint px-[9px] py-[3px] text-[12px] font-bold text-accent-soft">Latest</span> : null}
        </span>
      </div>
      <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3">
        <h2 className="m-0 text-[20px] font-bold">{r.title}</h2>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {r.items.map((it) => (
            <li key={it.text} className="flex items-baseline gap-2.5 text-[15px] leading-normal text-prose">
              <ChangeTag kind={it.kind} />
              <span>{it.text}</span>
            </li>
          ))}
        </ul>
        <span className="flex flex-wrap gap-4 text-[13px] font-bold">
          <a href={r.notesUrl} target="_blank" rel="noopener noreferrer">
            Release notes on GitHub ↗
          </a>
          {r.npmUrl ? (
            <a href={r.npmUrl} target="_blank" rel="noopener noreferrer">
              {r.version} on npm ↗
            </a>
          ) : null}
        </span>
      </div>
    </li>
  );
}
