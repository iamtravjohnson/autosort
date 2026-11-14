'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ICONS = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  smart: 'M4 6h10M4 12h10M4 18h7M17 8l2-4 2 4M19 4v16',
  sources: 'M4 5h16M4 5v14h16V5M9 9h6',
  sort: 'M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4',
  activity: 'M3 12h4l3-8 4 16 3-8h4',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.1z',
} as const;

export type NavIcon = keyof typeof ICONS;

export const NAV: Array<{ label: string; href: string; icon: NavIcon; mobile?: boolean }> = [
  { label: 'Home', href: '/app', icon: 'home', mobile: true },
  { label: 'Smart Playlists', href: '/app/playlists', icon: 'smart', mobile: true },
  { label: 'Sources', href: '/app/sources', icon: 'sources' },
  { label: 'Sort', href: '/app/sort', icon: 'sort' },
  { label: 'Activity', href: '/app/activity', icon: 'activity', mobile: true },
  { label: 'Settings', href: '/app/settings', icon: 'settings', mobile: true },
];

export function NavGlyph({ icon, size = 22 }: { icon: NavIcon; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[icon]} />
    </svg>
  );
}

function isActive(pathname: string, href: string) {
  return href === '/app' ? pathname === '/app' : pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop sidebar links. */
export function SidebarNav() {
  const pathname = usePathname();
  return (
    <>
      {NAV.map((n) => {
        const active = isActive(pathname, n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? 'page' : undefined}
            className={`flex h-11 items-center gap-3.5 rounded-sm px-3 text-[15px] font-bold no-underline ${active ? 'bg-surface-3 text-text-1' : 'text-text-2 hover:text-text-1'}`}
          >
            <NavGlyph icon={n.icon} />
            {n.label}
          </Link>
        );
      })}
    </>
  );
}

/** Phone tab bar (Home, Smart Playlists, Activity, Settings). */
export function MobileTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-30 flex justify-around px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-6 lg:hidden"
      style={{ background: 'linear-gradient(180deg, rgba(11,11,12,0) 0%, rgba(11,11,12,0.96) 30%, #0B0B0C 100%)' }}
    >
      {NAV.filter((n) => n.mobile).map((n) => {
        const active = isActive(pathname, n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? 'page' : undefined}
            className={`flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-bold no-underline ${active ? 'text-text-1' : 'text-text-2'}`}
          >
            <NavGlyph icon={n.icon} size={24} />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
