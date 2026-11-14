import type { ReactNode } from 'react';
import { Logo } from '@/components/logo';
import { SpotifyLogo } from '@/components/ui';
import { APP_VERSION, DISCLAIMER, DOCS_URL, GITHUB_URL } from '@/lib/config';

const GLOW = {
  // Setup: 1000×500 glow on desktop, 500×300 on phones (MSetup).
  setup:
    'bg-[radial-gradient(500px_300px_at_50%_-10%,#2A1F45_0%,#0B0B0C_70%)] sm:bg-[radial-gradient(1000px_500px_at_50%_-10%,#2A1F45_0%,#0B0B0C_60%)]',
  connect: 'bg-[radial-gradient(900px_480px_at_50%_-10%,#2A1F45_0%,#0B0B0C_60%)]',
} as const;

/** Full-page frame for screens outside the app shell: glow, centered logo, footer. */
export function AuthShell({ glow = 'connect', showVersion = false, children }: { glow?: keyof typeof GLOW; showVersion?: boolean; children: ReactNode }) {
  return (
    <div className={`flex min-h-dvh flex-col items-center gap-6 px-4 pb-8 pt-7 sm:gap-8 sm:px-5 sm:pb-10 sm:pt-16 ${GLOW[glow]}`}>
      <Logo size={34} wordmark={24} href="/" />
      {children}
      <footer className="mt-auto flex max-w-[520px] flex-col items-center gap-3 text-center text-[12px] text-text-3">
        {showVersion ? (
          <span className="tnum">
            AutoSort v{APP_VERSION} ·{' '}
            <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" className="text-text-3 hover:text-text-2">
              Docs
            </a>{' '}
            ·{' '}
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-text-3 hover:text-text-2">
              GitHub
            </a>
          </span>
        ) : null}
        <span>{DISCLAIMER}</span>
        <SpotifyLogo width={78} />
      </footer>
    </div>
  );
}

/** Warning / info callout used for sign-in errors and invite problems. */
export function Callout({ tone = 'warning', title, children }: { tone?: 'warning' | 'info' | 'error'; title?: ReactNode; children?: ReactNode }) {
  const styles = {
    warning: 'border-warning/35 bg-warning/[0.08] text-[#FEF3C7]',
    error: 'border-error/40 bg-error/[0.10] text-[#FEE2E2]',
    info: 'border-info/30 bg-info/[0.08] text-[#E0F2FE]',
  }[tone];
  return (
    <div role={tone === 'info' ? 'status' : 'alert'} className={`flex flex-col gap-2 rounded-card border px-4 py-3.5 text-[14px] leading-[1.55] ${styles}`}>
      {title ? <strong className="text-[15px] text-text-1">{title}</strong> : null}
      {children}
    </div>
  );
}
