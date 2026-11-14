'use client';

import { useEffect, useRef, useState } from 'react';

export interface TocItem {
  id: string;
  label: string;
}

/** Desktop "Contents" list that highlights the section being read. Server-renders with the first item active. */
export function ArticleToc({ items, title = 'Contents' }: { items: TocItem[]; title?: string }) {
  const [active, setActive] = useState(items[0]?.id);
  const visible = useRef(new Set<string>());

  useEffect(() => {
    const ids = items.map((i) => i.id);
    const seen = visible.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) seen.add(e.target.id);
          else seen.delete(e.target.id);
        }
        const first = ids.find((id) => seen.has(id));
        if (first) setActive(first);
      },
      { rootMargin: '-96px 0px -55% 0px' },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label={title} className="flex flex-col gap-2.5 text-[14px]">
      <h2 className="m-0 mb-1 text-[12px] font-bold uppercase tracking-[0.08em] text-text-3">{title}</h2>
      {items.map((t) => {
        const on = t.id === active;
        return (
          <a
            key={t.id}
            href={`#${t.id}`}
            aria-current={on ? 'location' : undefined}
            className={`-ml-3 border-l-2 pl-2.5 no-underline transition-colors duration-[120ms] ${
              on ? 'border-accent font-bold text-text-1 hover:text-text-1' : 'border-transparent text-text-2 hover:text-text-1'
            }`}
          >
            {t.label}
          </a>
        );
      })}
    </nav>
  );
}
