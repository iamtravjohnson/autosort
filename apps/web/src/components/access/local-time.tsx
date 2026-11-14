'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

function format(utcHour: number, utcMinute: number): string {
  const d = new Date();
  d.setUTCHours(utcHour, utcMinute, 0, 0);
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return `That’s ${time} your time${zone ? ` (${zone.replace(/_/g, ' ')})` : ''}.`;
}

/** "That's 5:00 AM your time (America/Chicago)." Rendered in the browser only (the server can't know the time zone). */
export function LocalTime({ utcHour, utcMinute }: { utcHour: number; utcMinute: number }) {
  const text = useSyncExternalStore(
    subscribe,
    () => format(utcHour, utcMinute),
    () => null,
  );
  return text ? <span>{text}</span> : null;
}
