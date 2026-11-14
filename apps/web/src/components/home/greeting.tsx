'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

function partOfDay(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** "Good morning, Dana" in the viewer's own time zone ("Hi, Dana" until the browser takes over). */
export function Greeting({ firstName }: { firstName: string | null }) {
  const greeting = useSyncExternalStore(subscribe, partOfDay, () => 'Hi');
  return (
    <h1 className="m-0 text-[24px] font-extrabold tracking-[-0.02em] sm:text-[36px] sm:tracking-[-0.03em]">
      {greeting}
      {firstName ? `, ${firstName}` : ''}
    </h1>
  );
}
