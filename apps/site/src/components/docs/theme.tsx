'use client';

import { useLayoutEffect, useSyncExternalStore } from 'react';
import { MoonIcon, SunIcon } from '@/components/icons';

/**
 * Docs light/dark theme. The theme lives on the docs wrapper as data-theme="light" | "dark"
 * (default dark) and is saved in localStorage. An inline script applies the saved value before
 * first paint on full page loads; ThemeToggle re-applies it after client-side navigations.
 */

export type DocsTheme = 'light' | 'dark';

const STORAGE_KEY = 'autosort-docs-theme';
const ROOT_SELECTOR = '[data-docs-root]';
const listeners = new Set<() => void>();

function rootEl(): HTMLElement | null {
  return document.querySelector<HTMLElement>(ROOT_SELECTOR);
}

function readTheme(): DocsTheme {
  return rootEl()?.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function readStored(): DocsTheme | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function setDocsTheme(theme: DocsTheme, persist = true) {
  rootEl()?.setAttribute('data-theme', theme);
  if (persist) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable (private mode, blocked); the choice lasts for this page only */
    }
  }
  listeners.forEach((l) => l());
}

export function useDocsTheme(): DocsTheme {
  return useSyncExternalStore(subscribe, readTheme, () => 'dark');
}

const SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});var r=document.querySelector(${JSON.stringify(
  ROOT_SELECTOR,
)});if(r&&(t==="light"||t==="dark"))r.setAttribute("data-theme",t)}catch(e){}})()`;

/**
 * Runs during HTML parsing (before paint) on full page loads. On the client it renders as an inert
 * text/plain block, which avoids React's "script tag" warning; ThemeToggle handles soft navigations.
 * Render it inside the docs wrapper.
 */
export function ThemeScript() {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
    />
  );
}

/** Round icon button in the docs header. */
export function ThemeToggle() {
  const theme = useDocsTheme();

  // After a client-side navigation into the docs the inline script doesn't run, so apply the saved theme here.
  useLayoutEffect(() => {
    const stored = readStored();
    if (stored && stored !== readTheme()) setDocsTheme(stored, false);
  }, []);

  const next: DocsTheme = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      aria-label={`Switch to ${next} theme`}
      onClick={() => setDocsTheme(next)}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-pill bg-[var(--d-chip)] text-[var(--d-text-2)] transition-colors duration-[120ms] hover:text-[var(--d-text)]"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

/** "Theme: Light | Dark" segmented control in the mobile docs drawer. */
export function ThemeSegmented() {
  const theme = useDocsTheme();
  const options: Array<{ value: DocsTheme; label: string }> = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];
  return (
    <div className="flex items-center justify-between text-[13px] text-[var(--d-text-2)]">
      <span id="docs-theme-label">Theme</span>
      <div role="group" aria-labelledby="docs-theme-label" className="flex rounded-pill bg-[var(--d-input)] p-[3px] font-bold">
        {options.map((o) => {
          const selected = theme === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              onClick={() => setDocsTheme(o.value)}
              className={`rounded-pill px-3 py-[5px] transition-colors duration-200 ${
                selected ? 'bg-[var(--d-seg-active-bg)] text-[var(--d-seg-active-text)]' : 'text-[var(--d-text-2)] hover:text-[var(--d-text)]'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
