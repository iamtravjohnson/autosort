import Image from 'next/image';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { toCamelot } from '@autosort/core';
import { ArrowUpIcon, CheckIcon, XIcon } from './icons';
import { withBase } from '@/lib/base-path';

/* ---------- Layout ---------- */

export function Container({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-6 ${className}`}>{children}</div>;
}

/** A page section with the design's 72px vertical rhythm. `tone="raised"` uses surface-1. */
export function Section({
  id,
  tone = 'base',
  className = '',
  children,
  labelledBy,
}: {
  id?: string;
  tone?: 'base' | 'raised';
  className?: string;
  children: ReactNode;
  labelledBy?: string;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`${tone === 'raised' ? 'bg-surface-1' : ''} py-12 sm:py-[72px] ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`text-[13px] font-semibold uppercase tracking-[0.08em] text-accent-hover ${className}`}>{children}</span>;
}

/** Section heading (H2) with optional lead paragraph. */
export function SectionHeading({ id, title, lead, className = '' }: { id?: string; title: ReactNode; lead?: ReactNode; className?: string }) {
  return (
    <div className={`flex max-w-[760px] flex-col gap-3 ${className}`}>
      <h2 id={id} className="m-0 text-[32px] font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-[40px]">
        {title}
      </h2>
      {lead ? <p className="m-0 text-[17px] leading-[1.6] text-text-2">{lead}</p> : null}
    </div>
  );
}

/* ---------- Buttons (all pills) ---------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'white' | 'sponsor';
type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-bg hover:bg-accent-hover hover:text-bg',
  secondary: 'border border-white/30 text-text-1 hover:border-white/60 hover:text-text-1',
  ghost: 'text-text-2 hover:text-text-1',
  white: 'bg-white text-bg hover:bg-white/90 hover:text-bg',
  sponsor: 'bg-surface-3 text-text-1 hover:bg-[#303035] hover:text-text-1',
};
const SIZE: Record<ButtonSize, string> = {
  sm: 'h-10 px-5 text-[14px]',
  md: 'h-12 px-6 text-[15px]',
  lg: 'h-[52px] px-7 text-[16px]',
};

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = '') {
  return `inline-flex items-center justify-center gap-2 rounded-pill font-bold no-underline whitespace-nowrap transition-colors duration-[120ms] ${VARIANT[variant]} ${SIZE[size]} ${extra}`;
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  external,
  ...rest
}: Omit<ComponentProps<typeof Link>, 'href'> & { href: string; variant?: ButtonVariant; size?: ButtonSize; external?: boolean }) {
  const cls = buttonClass(variant, size, className);
  if (external || href.startsWith('http')) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer" {...(rest as ComponentProps<'a'>)}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}

/* ---------- Chips ---------- */

export function Chip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex h-[30px] items-center gap-1 rounded-pill bg-surface-3 px-3 text-[13px] font-semibold text-text-1 ${className}`}>{children}</span>;
}

/** Rule chip: muted prefix + value, e.g. "Genre: Country". */
export function RuleChip({ label, value }: { label?: string; value: ReactNode }) {
  return (
    <Chip>
      {label ? <span className="text-text-3">{label}:</span> : null}
      {value}
    </Chip>
  );
}

export const CAMELOT_A = ['#1E8070', '#1F8449', '#3F801E', '#74741B', '#916C22', '#954923', '#952323', '#952352', '#95238B', '#652395', '#232395', '#236595'];
export const CAMELOT_B = ['#79ECD9', '#79ECA9', '#9FEC79', '#ECEC79', '#ECC679', '#EC9F79', '#EC7979', '#EC79A9', '#EC79E2', '#BC79EC', '#7979EC', '#79BCEC'];

export function camelotColors(code: string): { bg: string; fg: string } {
  const m = /^(\d{1,2})([AB])$/.exec(code);
  if (!m) return { bg: '#26262A', fg: '#8A8A93' };
  const i = Number(m[1]) - 1;
  return m[2] === 'A' ? { bg: CAMELOT_A[i] ?? '#26262A', fg: '#FFFFFF' } : { bg: CAMELOT_B[i] ?? '#26262A', fg: '#0B0B0C' };
}

/** Camelot key chip in its wheel color, e.g. "8A". Pass a code or a pitch class + mode. */
export function KeyChip({ code, pitch, mode, size = 'md' }: { code?: string | null; pitch?: number; mode?: number; size?: 'sm' | 'md' }) {
  const value = code ?? (pitch !== undefined && mode !== undefined ? toCamelot(pitch, mode) : null);
  const { bg, fg } = camelotColors(value ?? '');
  return (
    <span
      className={`tnum inline-flex items-center justify-center rounded-pill font-bold ${size === 'sm' ? 'px-2 py-[3px] text-[12px]' : 'px-2.5 py-1 text-[13px]'}`}
      style={{ background: bg, color: fg }}
    >
      {value ?? '—'}
    </span>
  );
}

export type TransitionKind = 'perfect' | 'adjacent' | 'relative' | 'diagonal' | 'boost' | 'clash';

const TRANSITION_STYLE: Record<'perfect' | 'good' | 'boost' | 'clash', { fg: string; bg: string; label: string }> = {
  perfect: { fg: '#5EEAD4', bg: 'rgba(45,212,191,0.14)', label: 'Perfect' },
  good: { fg: '#7DD3FC', bg: 'rgba(56,189,248,0.14)', label: 'Good' },
  boost: { fg: '#C4B5FD', bg: 'rgba(167,139,250,0.16)', label: 'Energy boost' },
  clash: { fg: '#FCA5A5', bg: 'rgba(248,113,113,0.14)', label: 'Clash' },
};

/** Transition chip: Perfect / Good / Energy boost / Clash. */
export function TransitionChip({ kind }: { kind: TransitionKind }) {
  const group = kind === 'perfect' ? 'perfect' : kind === 'boost' ? 'boost' : kind === 'clash' ? 'clash' : 'good';
  const s = TRANSITION_STYLE[group];
  const Icon = group === 'perfect' ? CheckIcon : group === 'boost' ? ArrowUpIcon : group === 'clash' ? XIcon : null;
  return (
    <span className="inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[12px] font-bold" style={{ color: s.fg, background: s.bg }}>
      {Icon ? <Icon size={13} /> : null}
      {s.label}
    </span>
  );
}

/* ---------- Content blocks ---------- */

/** The "Quick answer" box that sits directly under every H1 (lifted by snippets and AI answers). */
export function QuickAnswer({ children }: { children: ReactNode }) {
  return (
    <aside aria-label="Quick answer" className="flex flex-col gap-2 rounded-card border border-accent/40 bg-surface-1 px-5 py-[18px]">
      <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-accent-soft">Quick answer</span>
      <p className="m-0 text-[15px] leading-[1.6] text-[#E4E4E7]">{children}</p>
    </aside>
  );
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-card border border-line bg-surface-1 p-6 ${className}`}>{children}</div>;
}

/** Numbered step circle (violet tint). */
export function StepNumber({ n, size = 36 }: { n: number; size?: number }) {
  return (
    <span
      className="tnum inline-flex shrink-0 items-center justify-center rounded-pill bg-accent-tint font-extrabold text-accent-soft"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {n}
    </span>
  );
}

const SPOTIFY_LOGO_RATIO = 225.25 / 823.46;

/**
 * Spotify attribution with Spotify's official full logo (unmodified files from
 * developer.spotify.com/documentation/design, in /public/brand/spotify).
 * Spotify's rules: white logo on dark backgrounds, black on light (green only on pure black or white),
 * at least 70px wide, clear space of half the icon's height, and never used inside a sentence.
 */
export function SpotifyLogo({ tone = 'white', width = 84, className = '' }: { tone?: 'white' | 'black'; width?: number; className?: string }) {
  return (
    <Image
      src={withBase(tone === 'white' ? '/brand/spotify/Full_Logo_White_RGB.svg' : '/brand/spotify/Full_Logo_Black_RGB.svg')}
      alt="Spotify"
      width={Math.max(70, width)}
      height={Math.round(Math.max(70, width) * SPOTIFY_LOGO_RATIO)}
      unoptimized
      className={`inline-block shrink-0 ${className}`}
    />
  );
}

/** Attribution block for page footers: the official Spotify logo on its own (not inside a sentence). */
export function WorksWithSpotify({ className = '', tone = 'white' }: { className?: string; tone?: 'white' | 'black' }) {
  return (
    <span className={`inline-flex items-center p-1.5 ${className}`}>
      <SpotifyLogo tone={tone} />
    </span>
  );
}

/** Callout notes: info / warning / violet ("Important"). */
export function Note({ tone = 'info', title, children }: { tone?: 'info' | 'warning' | 'violet'; title?: string; children: ReactNode }) {
  const styles = {
    info: 'border-info/30 bg-info/[0.08] text-[#E0F2FE]',
    warning: 'border-warning/35 bg-warning/[0.08] text-[#FEF3C7]',
    violet: 'border-accent/40 bg-accent/10 text-[#EDE9FE]',
  }[tone];
  return (
    <div role="note" className={`rounded-card border px-[18px] py-4 text-[15px] leading-[1.6] ${styles}`}>
      {title ? <strong className="mb-1 block text-text-1">{title}</strong> : null}
      {children}
    </div>
  );
}
