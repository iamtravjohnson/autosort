import type { ReactNode } from 'react';
import { camelotColors } from '@/components/ui';

/**
 * Camelot code pill in its wheel color. `fixed` gives the 48px-wide chip the design uses in
 * lists and tables; otherwise it hugs its text.
 */
export function CamelotChip({
  code,
  size = 'md',
  fixed = false,
  title,
  children,
}: {
  code: string | null;
  size?: 'sm' | 'md' | 'lg';
  fixed?: boolean;
  title?: string;
  children?: ReactNode;
}) {
  const { bg, fg } = camelotColors(code ?? '');
  const sizing = {
    sm: 'px-2.5 py-[3px] text-[12px]',
    md: fixed ? 'w-12 py-1 text-[13px]' : 'px-3 py-[5px] text-[13px]',
    lg: 'px-3 py-1 text-[16px]',
  }[size];
  return (
    <span
      title={title}
      className={`tnum inline-flex shrink-0 items-center justify-center rounded-pill font-extrabold leading-[1.3] ${sizing}`}
      style={{ background: bg, color: fg }}
    >
      {code ?? '—'}
      {children}
    </span>
  );
}
