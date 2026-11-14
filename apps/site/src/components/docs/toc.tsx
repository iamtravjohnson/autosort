'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDownIcon } from '@/components/icons';

export interface TocItem {
  id: string;
  label: string;
}

/** The id of the section currently at the top of the viewport. */
function useActiveSection(items: TocItem[]): string {
  const key = items.map((i) => i.id).join('|');
  const [active, setActive] = useState(items[0]?.id ?? '');

  useEffect(() => {
    const ids = key ? key.split('|') : [];
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = ids[0] ?? '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) current = id;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom && ids.length) current = ids[ids.length - 1];
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [key]);

  return active;
}

/** Desktop "On this page" list with the current section highlighted. */
export function DocsToc({ items }: { items: TocItem[] }) {
  const active = useActiveSection(items);
  return (
    <nav aria-label="On this page" className="flex flex-col gap-2.5 text-[13px]">
      <p className="m-0 mb-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--d-text-3)]">On this page</p>
      {items.map((t) => {
        const current = t.id === active;
        return (
          <a
            key={t.id}
            href={`#${t.id}`}
            aria-current={current ? 'location' : undefined}
            className={`-ml-3 border-l-2 pl-2.5 leading-[1.4] no-underline transition-colors duration-[120ms] ${
              current
                ? 'border-[var(--d-accent)] font-bold text-[var(--d-text)]'
                : 'border-transparent text-[var(--d-text-2)] hover:text-[var(--d-text)]'
            }`}
          >
            {t.label}
          </a>
        );
      })}
    </nav>
  );
}

/** Mobile "On this page" dropdown in the sticky docs bar. */
export function MobileToc({ items }: { items: TocItem[] }) {
  const [open, setOpen] = useState(false);
  const active = useActiveSection(items);
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (items.length === 0) return null;
  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-pill bg-[var(--d-chip)] px-3.5 text-[14px] font-semibold text-[var(--d-text-2)]"
      >
        On this page
        <ChevronDownIcon size={14} strokeWidth={2.5} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-[calc(100%+8px)] z-20 rounded-card border border-[var(--d-border-strong)] bg-[var(--d-drawer)] p-1.5 shadow-e2"
      >
        <ul className="m-0 flex list-none flex-col p-0">
          {items.map((t) => (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                onClick={() => setOpen(false)}
                aria-current={t.id === active ? 'location' : undefined}
                className={`flex min-h-11 items-center rounded-sm px-3 text-[14px] no-underline ${
                  t.id === active ? 'bg-[var(--d-tint)] font-bold text-[var(--d-active-text)]' : 'text-[var(--d-text-2)] hover:text-[var(--d-text)]'
                }`}
              >
                {t.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
