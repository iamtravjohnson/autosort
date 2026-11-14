import type { ConnectionState } from '@/lib/access';

/** Member avatar colors from the design (initial in near-black, weight 800). */
const AVATAR = ['#A78BFA', '#F472B6', '#FBBF24', '#38BDF8', '#2DD4BF'];

export function Avatar({ name, index = 0, size = 40 }: { name: string; index?: number; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-pill font-extrabold text-bg"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38), background: AVATAR[index % AVATAR.length] }}
    >
      {(name.trim()[0] ?? '?').toUpperCase()}
    </span>
  );
}

const PILL = {
  success: 'bg-success/[0.14] text-success-text',
  info: 'bg-info/[0.14] text-info-text',
  warning: 'bg-warning/[0.14] text-warning-text',
  muted: 'bg-surface-3 text-text-2',
} as const;

export function StatusPill({ tone, children }: { tone: keyof typeof PILL; children: React.ReactNode }) {
  return <span className={`inline-flex shrink-0 items-center rounded-pill px-2.5 py-1 text-[12px] font-bold ${PILL[tone]}`}>{children}</span>;
}

export function ConnectionPill({ state }: { state: ConnectionState }) {
  if (state === 'connected') return <StatusPill tone="success">Connected</StatusPill>;
  if (state === 'reconnect') return <StatusPill tone="warning">Needs to reconnect</StatusPill>;
  return <StatusPill tone="muted">Not connected</StatusPill>;
}
