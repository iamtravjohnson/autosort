import type { ReactNode } from 'react';
import { DocsDrawer, DocsNav, DocsShellProvider } from '@/components/docs/docs-shell';
import { DocsFooter, DocsHeader } from '@/components/docs/docs-ui';
import { ThemeScript } from '@/components/docs/theme';
import './docs.css';

/**
 * Docs shell: its own header (logo, search, theme toggle, GitHub stars), left page list, and a
 * disclaimer footer. Each page renders its main column and right "On this page" TOC (DocsPage).
 * The theme lives on this wrapper as data-theme (dark by default; see docs.css).
 */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div data-docs-root="" data-theme="dark" suppressHydrationWarning className="docs-root flex flex-1 flex-col">
      <ThemeScript />
      <DocsShellProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-pill focus:bg-white focus:px-4 focus:py-2 focus:text-[#0b0b0c]"
        >
          Skip to content
        </a>
        <DocsHeader />
        <div className="mx-auto flex w-full max-w-[1440px] flex-1 items-start gap-10 px-4 sm:px-6">
          <aside aria-label="Docs navigation" className="sticky top-0 -mx-1 hidden max-h-dvh w-[248px] shrink-0 overflow-y-auto px-1 py-8 lg:block">
            <DocsNav id="docs-nav-sidebar" />
          </aside>
          {children}
        </div>
        <DocsFooter />
        <DocsDrawer />
      </DocsShellProvider>
    </div>
  );
}
