import { camelotToKeyName, transition } from '@autosort/core';
import { HeartIcon } from '@/components/icons';
import { KeyChip, TransitionChip } from '@/components/ui';
import type { HeroVisual as HeroVisualData } from '@/content/features';

/** Flat placeholder album-art colors from the design tokens. */
const ART = ['#4A3B2A', '#2F3B4A', '#3A2F4A', '#4A4530', '#2F4A40', '#4A302F', '#3E2F4A'];

const FIGURE = 'm-0 flex min-w-0 flex-[1_1_420px] flex-col rounded-panel bg-surface-1 p-6';

function Note({ children }: { children: string }) {
  return <figcaption className="text-[12px] text-text-3">{children}</figcaption>;
}

function Heading({ title, caption, right }: { title: string; caption: string; right?: string }) {
  return (
    <div className="tnum flex flex-wrap justify-between gap-x-4 gap-y-1 text-[13px] text-text-2">
      <span>
        <strong className="text-text-1">{title}</strong> · {caption}
      </span>
      {right ? <span>{right}</span> : null}
    </div>
  );
}

/** "Start" chip for the first song of a mix (no transition into it). */
export function StartChip() {
  return <span className="inline-flex items-center rounded-pill bg-surface-3 px-2.5 py-1 text-[12px] font-bold text-text-2">Start</span>;
}

export function HeroVisual({ hero }: { hero: HeroVisualData }) {
  switch (hero.type) {
    case 'fanout':
      return (
        <figure role="img" aria-label={hero.ariaLabel} className={`${FIGURE} gap-4`}>
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="tnum flex max-w-[180px] flex-[0_0_34%] flex-col gap-2.5 rounded-card bg-surface-2 p-3.5">
              {hero.source.cover === 'liked' ? (
                <span className="flex aspect-square items-center justify-center rounded-art text-white" style={{ background: 'linear-gradient(145deg, #8B5CF6, #1E1B4B)' }}>
                  <HeartIcon size={30} />
                </span>
              ) : (
                <span className="grid aspect-square grid-cols-2 overflow-hidden rounded-art">
                  {ART.slice(0, 4).map((c) => (
                    <span key={c} style={{ background: c }} />
                  ))}
                </span>
              )}
              <span className="text-[18px] font-extrabold leading-tight">{hero.source.name}</span>
              <span className="text-[12px] text-text-2">{hero.source.sub}</span>
            </div>
            <svg width="40" height="24" viewBox="0 0 40 24" aria-hidden="true" className="w-6 shrink-0 sm:w-10">
              <path d="M2 12h32M26 4l8 8-8 8" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="tnum flex min-w-0 flex-1 flex-col gap-2">
              {hero.targets.map((t) => (
                <div key={t.name} className="flex items-center gap-2.5 rounded-sm bg-surface-2 py-1.5 pl-1.5 pr-2.5">
                  <span className="size-7 shrink-0 rounded-art" style={{ background: t.cover }} />
                  <span className="min-w-0 flex-1 text-[14px] font-bold leading-tight">{t.name}</span>
                  <span className="text-[13px] text-text-2">{t.count.toLocaleString('en-US')}</span>
                </div>
              ))}
            </div>
          </div>
          <Note>{hero.note}</Note>
        </figure>
      );

    case 'bars':
      return (
        <figure role="img" aria-label={hero.ariaLabel} className={`${FIGURE} gap-4`}>
          <Heading title={hero.title} caption={hero.caption} right={hero.range} />
          <div className="flex h-[220px] items-end gap-1.5 border-b border-white/12">
            {hero.bars.map((b, i) => (
              <span
                key={i}
                title={b.label}
                className="flex-1 rounded-t-[4px] bg-accent"
                style={{ height: `${Math.round((b.value / hero.max) * 200)}px` }}
              />
            ))}
          </div>
          <div className="tnum flex justify-between gap-2 text-[12px] text-text-3">
            <span>{hero.axis[0]}</span>
            <span className="text-center">{hero.axis[1]}</span>
            <span>{hero.axis[2]}</span>
          </div>
          <Note>{hero.note}</Note>
        </figure>
      );

    case 'harmonic': {
      const label = `Example harmonic mix: ${hero.tracks.map((t) => t.key).join(', ')}, with the transition quality between each song`;
      return (
        <figure role="img" aria-label={label} className={`${FIGURE} tnum gap-2.5`}>
          <Heading title={hero.title} caption={hero.caption} />
          {hero.tracks.map((t, i) => {
            const prev = hero.tracks[i - 1];
            const detail = hero.detail === 'keyName' ? camelotToKeyName(t.key) : hero.detail === 'bpm' && t.bpm ? `${t.bpm} BPM` : null;
            return (
              <div key={`${t.key}-${t.title}`} className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 rounded-sm bg-surface-2 px-2.5 py-1.5">
                <span className="flex justify-center">
                  <KeyChip code={t.key} />
                </span>
                <span className="truncate text-[14px] font-semibold">
                  {t.title}
                  {detail ? <span className="font-normal text-text-3"> · {detail}</span> : null}
                </span>
                <span className="justify-self-end">{prev ? <TransitionChip kind={transition(prev.key, t.key)} /> : <StartChip />}</span>
              </div>
            );
          })}
          <Note>{hero.note}</Note>
        </figure>
      );
    }

    case 'list':
      return (
        <figure role="img" aria-label={hero.ariaLabel} className={`${FIGURE} gap-2.5`}>
          <Heading title={hero.title} caption={hero.caption} />
          {hero.rows.map((r, i) => (
            <div key={r.title} className="flex items-center gap-3 rounded-sm bg-surface-2 px-2.5 py-2">
              <span className="size-9 shrink-0 rounded-art" style={{ background: ART[i % ART.length] }} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[14px] font-semibold">{r.title}</span>
                <span className={`truncate text-[12px] ${r.note ? 'text-accent-soft' : 'text-text-3'}`}>{r.note ?? r.artist}</span>
              </span>
              <span className="tnum shrink-0 text-[13px] font-bold">{r.value}</span>
            </div>
          ))}
          <Note>{hero.note}</Note>
        </figure>
      );
  }
}
