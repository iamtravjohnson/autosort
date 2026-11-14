'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject } from 'react';
import { SearchIcon, XIcon } from '@/components/icons';
import { WheelMark } from '@/components/logo';
import { docsNav } from '@/lib/routes';
import { docsPages, matchesDocsQuery, type DocsEntry } from './docs-index';
import { ThemeSegmented } from './theme';

/* ---------- Shared state: search query + mobile drawer ---------- */

interface DocsShell {
  query: string;
  setQuery: (q: string) => void;
  openDrawer: (focusSearch?: boolean) => void;
  closeDrawer: () => void;
  drawerRef: RefObject<HTMLDialogElement | null>;
  drawerSearchRef: RefObject<HTMLInputElement | null>;
}

const DocsShellContext = createContext<DocsShell | null>(null);

function useDocsShell(): DocsShell {
  const ctx = useContext(DocsShellContext);
  if (!ctx) throw new Error('Docs shell components must be rendered inside <DocsShellProvider>.');
  return ctx;
}

export function DocsShellProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const drawerRef = useRef<HTMLDialogElement>(null);
  const drawerSearchRef = useRef<HTMLInputElement>(null);

  const openDrawer = useCallback((focusSearch = false) => {
    const dialog = drawerRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    if (focusSearch) drawerSearchRef.current?.focus();
  }, []);
  const closeDrawer = useCallback(() => drawerRef.current?.close(), []);

  const value = useMemo(
    () => ({ query, setQuery, openDrawer, closeDrawer, drawerRef, drawerSearchRef }),
    [query, openDrawer, closeDrawer],
  );
  return <DocsShellContext.Provider value={value}>{children}</DocsShellContext.Provider>;
}

function filterPages(query: string): DocsEntry[] {
  return docsPages.filter((p) => matchesDocsQuery(p, query));
}

/* ---------- Search ---------- */

function useSearchKeys() {
  const { query, setQuery, closeDrawer } = useDocsShell();
  const router = useRouter();
  return (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const first = filterPages(query)[0];
      if (first) {
        e.preventDefault();
        setQuery('');
        closeDrawer();
        router.push(first.href);
      }
    } else if (e.key === 'Escape' && query) {
      e.preventDefault();
      e.stopPropagation();
      setQuery('');
    }
  };
}

/** Header search pill (lg and up, beside the sidebar it filters). Filters the docs page list; ⌘K / Ctrl+K focuses it. */
export function DocsSearch() {
  const { query, setQuery, openDrawer } = useDocsShell();
  const inputRef = useRef<HTMLInputElement>(null);
  const onKeyDown = useSearchKeys();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = inputRef.current;
        if (input && input.offsetParent !== null) {
          input.focus();
          input.select();
        } else {
          openDrawer(true);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openDrawer]);

  return (
    <label className="hidden h-10 max-w-[480px] flex-[1_1_280px] items-center gap-2.5 rounded-pill bg-[var(--d-chip)] px-3.5 text-[var(--d-text-3)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--d-accent)] lg:flex">
      <SearchIcon size={16} />
      <span className="sr-only">Search docs</span>
      <input
        ref={inputRef}
        type="search"
        placeholder="Search docs"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        aria-controls="docs-nav-sidebar"
        autoComplete="off"
        className="docs-search-input min-w-0 flex-1 border-0 bg-transparent text-[14px] text-[var(--d-text)] placeholder:text-[var(--d-text-3)]"
      />
      <kbd aria-hidden="true" className="rounded-[4px] border border-[var(--d-kbd-border)] px-1.5 py-0.5 text-[var(--d-text-2)]" style={{ fontSize: 11 }}>
        ⌘K
      </kbd>
    </label>
  );
}

/** Header search icon (below lg): opens the drawer with its search field focused. */
export function MobileSearchButton() {
  const { openDrawer } = useDocsShell();
  return (
    <button
      type="button"
      aria-label="Search docs"
      aria-haspopup="dialog"
      onClick={() => openDrawer(true)}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-pill bg-[var(--d-chip)] text-[var(--d-text-2)] hover:text-[var(--d-text)] lg:hidden"
    >
      <SearchIcon />
    </button>
  );
}

/* ---------- Page list ---------- */

/** The docs page list, grouped as in `docsNav`, filtered by the search query, current page highlighted. */
export function DocsNav({ variant = 'sidebar', id }: { variant?: 'sidebar' | 'drawer'; id?: string }) {
  const pathname = usePathname();
  const { query, setQuery, closeDrawer } = useDocsShell();
  const matches = filterPages(query);
  const drawer = variant === 'drawer';

  const groups = docsNav
    .map((g) => ({ heading: g.heading, links: matches.filter((p) => p.group === g.heading) }))
    .filter((g) => g.links.length > 0);

  return (
    <div id={id} className={`flex flex-col ${drawer ? 'gap-5' : 'gap-6'}`}>
      <p className="sr-only" aria-live="polite">
        {query ? `${matches.length} ${matches.length === 1 ? 'page matches' : 'pages match'} “${query}”` : ''}
      </p>
      {groups.map((g) => (
        <div key={g.heading} className="flex flex-col gap-0.5">
          <h2 className={`m-0 text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--d-text-3)] ${drawer ? 'mb-1 px-3' : 'mb-1.5'}`}>{g.heading}</h2>
          {g.links.map((l) => {
            const current = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={current ? 'page' : undefined}
                onClick={() => {
                  if (query) setQuery('');
                  if (drawer) closeDrawer();
                }}
                className={`rounded-sm no-underline transition-colors duration-[120ms] ${
                  drawer ? 'flex min-h-11 items-center px-3 text-[15px]' : 'px-3 py-[7px] text-[14px]'
                } ${
                  current
                    ? 'bg-[var(--d-tint)] font-bold text-[var(--d-active-text)]'
                    : 'font-medium text-[var(--d-text-2)] hover:bg-[var(--d-chip)] hover:text-[var(--d-text)]'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      ))}
      {groups.length === 0 ? (
        <p className={`m-0 text-[14px] leading-[1.5] text-[var(--d-text-3)] ${drawer ? 'px-3' : ''}`}>
          No docs pages match “{query}”.{' '}
          <button type="button" onClick={() => setQuery('')} className="font-semibold text-[var(--d-link)] underline-offset-2 hover:underline">
            Clear search
          </button>
        </p>
      ) : null}
    </div>
  );
}

/* ---------- Mobile drawer ---------- */

/** "Docs menu" pill in the mobile docs bar. */
export function DocsMenuButton() {
  const { openDrawer } = useDocsShell();
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() => openDrawer()}
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-pill bg-[var(--d-chip)] px-3.5 text-[14px] font-bold text-[var(--d-text)] lg:hidden"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h10" />
      </svg>
      Docs menu
    </button>
  );
}

/** Full-height navigation drawer for small screens (MDocsDrawer): search, page list, theme switch. */
export function DocsDrawer() {
  const { drawerRef, drawerSearchRef, closeDrawer, query, setQuery } = useDocsShell();
  const onKeyDown = useSearchKeys();

  return (
    <dialog
      ref={drawerRef}
      aria-label="Docs navigation"
      onClick={(e) => {
        // A click on the backdrop targets the <dialog> itself; clicks inside land on its content.
        if (e.target === e.currentTarget) closeDrawer();
      }}
      className="docs-drawer fixed inset-y-0 left-0 right-auto m-0 h-dvh max-h-none w-[320px] max-w-[calc(100vw-40px)] border-0 bg-[var(--d-drawer)] p-0 text-[var(--d-text)] shadow-[24px_0_64px_rgba(0,0,0,0.6)]"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[var(--d-border)] py-3 pl-4 pr-3">
          <span className="flex items-center gap-2 text-[18px] font-extrabold tracking-[-0.04em]">
            <WheelMark size={22} />
            AutoSort Docs
          </span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeDrawer}
            className="inline-flex size-11 items-center justify-center rounded-pill text-[var(--d-text)] hover:bg-[var(--d-chip)]"
          >
            <XIcon size={20} strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-4 py-3">
          <label className="flex h-11 items-center gap-2.5 rounded-pill bg-[var(--d-input)] px-3.5 text-[var(--d-text-3)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--d-accent)]">
            <SearchIcon size={16} />
            <input
              ref={drawerSearchRef}
              type="search"
              placeholder="Search docs"
              aria-label="Search docs"
              aria-controls="docs-nav-drawer"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              className="docs-search-input min-w-0 flex-1 border-0 bg-transparent text-[15px] text-[var(--d-text)] placeholder:text-[var(--d-text-3)]"
            />
          </label>
        </div>
        <nav aria-label="Docs pages" className="flex-1 overflow-y-auto px-2 pb-4 pt-1">
          <DocsNav variant="drawer" id="docs-nav-drawer" />
        </nav>
        <div className="border-t border-[var(--d-border)] px-4 pb-6 pt-3">
          <ThemeSegmented />
        </div>
      </div>
    </dialog>
  );
}
