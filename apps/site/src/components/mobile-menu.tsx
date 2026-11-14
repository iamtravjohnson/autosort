'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import type { NavLink } from '@/lib/routes';
import { MenuIcon, XIcon } from './icons';

/** Hamburger menu for screens narrower than the desktop nav. */
export function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-10 items-center justify-center rounded-pill bg-surface-2 text-text-1"
      >
        {open ? <XIcon /> : <MenuIcon />}
      </button>
      {open ? (
        <div id={panelId} className="absolute inset-x-0 top-full border-b border-line bg-bg px-6 pb-6 pt-2 shadow-e2">
          <ul className="m-0 flex list-none flex-col p-0">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className="block border-b border-line py-3.5 text-[17px] font-semibold text-text-1 no-underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
