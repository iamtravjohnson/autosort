'use client';

import { useState, type ReactNode } from 'react';

export interface FilterItem {
  key: string;
  /** Filter groups this item belongs to. */
  groups: string[];
  /** Server-rendered card. */
  card: ReactNode;
}

/** Category pills that filter the server-rendered recipe cards. Everything renders on the server with "All" selected. */
export function RecipeFilter({ groups, items }: { groups: string[]; items: FilterItem[] }) {
  const [active, setActive] = useState('All');
  const visible = items.filter((i) => active === 'All' || i.groups.includes(active)).length;

  return (
    <>
      <div role="group" aria-label="Filter recipes" className="flex flex-wrap gap-2">
        {['All', ...groups].map((g) => {
          const on = g === active;
          return (
            <button
              key={g}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(g)}
              className={`h-[38px] rounded-pill px-4 text-[14px] font-bold transition-colors duration-[120ms] ${
                on ? 'bg-white text-bg' : 'bg-surface-3 text-text-1 hover:bg-[#303035]'
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {active === 'All' ? `Showing all ${visible} recipes` : `Showing ${visible} ${active} recipes`}
      </p>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5 p-0">
        {items.map((i) => (
          <li key={i.key} hidden={active !== 'All' && !i.groups.includes(active)}>
            {i.card}
          </li>
        ))}
      </ul>
    </>
  );
}
