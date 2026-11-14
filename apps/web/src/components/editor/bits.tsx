import Image from 'next/image';
import type { ReactNode } from 'react';
import type { ActionResult } from '@/lib/rules-ui';
import { withBase } from '@/lib/base-path';

/** Album art (decorative: the title sits next to it). Falls back to a flat tile. */
export function Art({ url, size = 40, className = '' }: { url: string | null | undefined; size?: number; className?: string }) {
  if (!url) return <span aria-hidden="true" className={`block shrink-0 rounded-art bg-surface-3 ${className}`} style={{ width: size, height: size }} />;
  return <Image src={url} alt="" width={size} height={size} unoptimized className={`block shrink-0 rounded-art object-cover ${className}`} style={{ width: size, height: size }} />;
}

/** Result of a server action: success line, or an error with a "Reconnect Spotify" link when needed. */
export function ActionNotice({ result, className = '' }: { result: ActionResult | null | undefined; className?: string }) {
  if (!result) return null;
  if (result.ok) {
    if (!result.message) return null;
    return (
      <p role="status" className={`m-0 text-[14px] text-success-text ${className}`}>
        {result.message}
        {result.href ? (
          <>
            {' '}
            <a href={result.href} target="_blank" rel="noopener noreferrer" className="font-bold">
              Open in Spotify ↗
            </a>
          </>
        ) : null}
      </p>
    );
  }
  return (
    <p role="alert" className={`m-0 text-[14px] text-error-text ${className}`}>
      {result.error}
      {result.reconnect ? (
        <>
          {' '}
          <a href={withBase('/api/auth/login')} className="font-bold">
            Reconnect Spotify
          </a>
        </>
      ) : null}
    </p>
  );
}

/** Rounded section panel used across the editor (surface-2, like the boards). */
export function Panel({ id, title, aside, children, className = '' }: { id: string; title: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={`flex flex-col gap-3 rounded-card bg-surface-2 p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="m-0 text-[18px] font-bold">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Pill segmented control (radiogroup), e.g. "Match all / Any" or "Original / Sorted". */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  size = 'md',
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex shrink-0 rounded-pill bg-surface-3 p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`rounded-pill font-bold transition-colors duration-200 ${size === 'sm' ? 'h-7 px-3 text-[12px]' : 'h-8 px-3.5 text-[13px]'} ${on ? 'bg-white text-bg' : 'text-text-2 hover:text-text-1'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block size-4 shrink-0 animate-spin rounded-pill border-2 border-current border-r-transparent ${className}`} />;
}
