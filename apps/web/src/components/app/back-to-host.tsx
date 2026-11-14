import { hostLink } from '@/lib/config';

/** "← Back to JohnsonOS": shown when HOST_APP_URL is set. A plain <a>, since it leaves this app. */
export function BackToHost({ className = '' }: { className?: string }) {
  const host = hostLink();
  if (!host) return null;
  return (
    <a href={host.url} className={`inline-flex items-center gap-1.5 text-[13px] font-bold text-text-2 no-underline hover:text-text-1 ${className}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back to {host.name}
    </a>
  );
}
