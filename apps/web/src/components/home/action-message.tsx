import Link from 'next/link';
import type { ActionState } from '@/lib/stats';

/** Result line under a form: success in teal, problems in red, with "Reconnect Spotify" when needed. */
export function ActionMessage({ state, className = '' }: { state: ActionState | null | undefined; className?: string }) {
  if (!state?.message) return null;
  return (
    <p
      role={state.ok ? 'status' : 'alert'}
      className={`m-0 rounded-card px-3.5 py-2.5 text-[14px] leading-[1.5] ${state.ok ? 'bg-success/[0.14] text-success-text' : 'bg-error/[0.14] text-error-text'} ${className}`}
    >
      {state.message}
      {state.reconnect ? (
        <>
          {' '}
          <a href="/api/auth/login" className="font-bold text-current underline">
            Reconnect Spotify
          </a>
        </>
      ) : null}
      {state.href ? (
        <>
          {' '}
          <Link href={state.href} className="font-bold text-current underline">
            {state.hrefLabel ?? 'Open'}
          </Link>
        </>
      ) : null}
    </p>
  );
}
