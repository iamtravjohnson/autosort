'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckIcon, CopyIcon } from '@/components/icons';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API needs a secure context; fall back to a hidden textarea.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

/** "Copy" button that writes `text` to the clipboard and says so. */
export function CopyButton({
  text,
  label = 'Copy',
  copiedLabel = 'Copied',
  description,
  className = '',
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  /** What is being copied, for screen readers, e.g. "Copy redirect URI". */
  description?: string;
  className?: string;
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function onClick() {
    const ok = await copyText(text);
    setState(ok ? 'copied' : 'failed');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label={description}
        className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-sm bg-surface-3 px-4 text-[13px] font-bold text-text-1 transition-colors duration-[120ms] hover:bg-[#303035] ${className}`}
      >
        {state === 'copied' ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
        {state === 'copied' ? copiedLabel : state === 'failed' ? 'Select and copy' : label}
      </button>
      <span className="sr-only" aria-live="polite">
        {state === 'copied' ? 'Copied to clipboard' : state === 'failed' ? 'Could not copy. Select the text and copy it.' : ''}
      </span>
    </>
  );
}

/** A mono value (URI, invite link) with a Copy button beside it. */
export function CopyRow({ value, display, description, truncate = false }: { value: string; display?: string; description?: string; truncate?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-white/12 bg-bg py-1 pl-4 pr-1">
      <code
        className={`min-w-0 flex-1 font-mono text-[13px] sm:text-[14px] ${truncate ? 'truncate' : 'break-all py-2'}`}
        title={truncate ? value : undefined}
      >
        {display ?? value}
      </code>
      <CopyButton text={value} description={description} />
    </div>
  );
}
