'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckIcon, CopyIcon } from '@/components/icons';

/** Copies the recipe JSON (`{ name, rule, order }`) to the clipboard. */
export function CopyRecipeButton({ json, name }: { json: string; name: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(json);
      ok = true;
    } catch {
      // Older browsers or blocked clipboard: fall back to a hidden textarea.
      const ta = document.createElement('textarea');
      ta.value = json;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      ta.remove();
    }
    setState(ok ? 'copied' : 'failed');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 2400);
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-[52px] items-center gap-2 rounded-pill border border-white/30 bg-transparent px-[22px] text-[16px] font-bold text-text-1 transition-colors duration-[120ms] hover:border-white/60"
      >
        {state === 'copied' ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy recipe'}
      </button>
      <span className="sr-only" aria-live="polite">
        {state === 'copied'
          ? `${name} recipe JSON copied to the clipboard`
          : state === 'failed'
            ? 'Could not copy. The recipe JSON is shown further down the page.'
            : ''}
      </span>
    </>
  );
}
