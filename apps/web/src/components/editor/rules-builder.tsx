'use client';

import { camelotToKeyName, GENRE_BUCKETS, GENRE_LABELS, MOODS, ruleChips, THEMES, type Condition, type Rule } from '@autosort/core';
import { useId, useState, type ReactNode } from 'react';
import { ChevronDownIcon, XIcon } from '@/components/icons';
import { camelotColors } from '@/components/ui';
import {
  ADDABLE_FIELDS,
  CAMELOT_KEYS,
  DECADES,
  decadeName,
  defaultCondition,
  FIELD_LABELS,
  genreLabel,
  genreValue,
  isGroup,
  moodLabel,
  PERCENT_FIELDS,
  themeLabel,
  type FieldKey,
} from '@/lib/rules-ui';

export interface RuleHints {
  /** Raw genres and artists from the selected sources, most common first (for autocomplete). */
  genres: string[];
  artists: string[];
  tags: string[];
}

const CELL = 'h-10 rounded-card bg-bg md:bg-surface-3';

/** The condition rows plus "Add rule" buttons. Match all/any lives with the caller. */
export function RulesBuilder({ rule, onChange, hints }: { rule: Rule; onChange: (r: Rule) => void; hints: RuleHints }) {
  const setAt = (i: number, c: Condition | Rule) => onChange({ ...rule, conditions: rule.conditions.map((x, j) => (j === i ? c : x)) });
  const removeAt = (i: number) => onChange({ ...rule, conditions: rule.conditions.filter((_, j) => j !== i) });
  const add = (f: FieldKey) => onChange({ ...rule, conditions: [...rule.conditions, defaultCondition(f)] });

  return (
    <div className="flex flex-col gap-3">
      {rule.conditions.length === 0 ? <p className="m-0 text-[14px] text-text-2">No rules yet, so every song in your sources matches. Add one below.</p> : null}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {rule.conditions.map((c, i) => (
          <li key={`${i}-${isGroup(c) ? 'group' : c.field}`}>
            {isGroup(c) ? (
              <GroupRow group={c} onRemove={() => removeAt(i)} />
            ) : (
              <ConditionRow condition={c} hints={hints} onChange={(n) => setAt(i, n)} onRemove={() => removeAt(i)} />
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[13px] text-text-3">Add rule:</span>
        {ADDABLE_FIELDS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => add(f)}
            className="h-8 rounded-pill border border-white/16 px-3 text-[13px] font-semibold text-text-1 transition-colors duration-[120ms] hover:border-white/40"
          >
            + {f === 'explicit' ? 'Clean only' : FIELD_LABELS[f]}
          </button>
        ))}
      </div>
    </div>
  );
}

function RemoveButton({ label, onClick, className = '' }: { label: string; onClick: () => void; className?: string }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={`flex size-8 items-center justify-center rounded-pill text-text-3 hover:bg-white/10 hover:text-text-1 ${className}`}>
      <XIcon size={14} strokeWidth={2.5} />
    </button>
  );
}

function GroupRow({ group, onRemove }: { group: Rule; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card bg-surface-3 px-3 py-2 text-[14px]">
      <span className="min-w-0">
        <span className="font-semibold">Group ({group.match === 'all' ? 'all of' : 'any of'})</span>{' '}
        <span className="text-text-2">{ruleChips(group).join(group.match === 'all' ? ' and ' : ' or ')}</span>
      </span>
      <RemoveButton label="Remove this group" onClick={onRemove} />
    </div>
  );
}

function Select({ label, value, onChange, children, className = '' }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode; className?: string }) {
  return (
    <span className={`relative flex min-w-0 ${className}`}>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${CELL} w-full min-w-0 cursor-pointer appearance-none border border-transparent pl-3 pr-8 text-[14px] font-semibold text-text-1 focus:border-accent`}
      >
        {children}
      </select>
      <ChevronDownIcon size={14} strokeWidth={2.5} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-2" />
    </span>
  );
}

function Static({ children }: { children: ReactNode }) {
  return <span className={`${CELL} flex items-center px-3 text-[14px] text-text-2`}>{children}</span>;
}

type InOutField = Extract<Condition, { notIn?: unknown }>;

/** Value editors with many options get their own line so they have room to breathe. */
const WIDE_FIELDS = new Set<FieldKey>(['mood', 'theme', 'decade', 'camelot']);

function wideSummary(c: Condition): string {
  const picked =
    c.field === 'mood'
      ? (c.in ?? c.notIn ?? []).map(moodLabel)
      : c.field === 'theme'
        ? (c.in ?? c.notIn ?? []).map(themeLabel)
        : c.field === 'decade'
          ? c.in.map(decadeName)
          : c.field === 'camelot'
            ? c.in
            : [];
  return picked.length ? picked.join(', ') : 'Pick below';
}

function ConditionRow({ condition: c, hints, onChange, onRemove }: { condition: Condition; hints: RuleHints; onChange: (c: Condition) => void; onRemove: () => void }) {
  const label = c.field === 'explicit' ? 'Clean only' : FIELD_LABELS[c.field];
  const wide = WIDE_FIELDS.has(c.field);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_32px] items-start gap-2 rounded-card bg-surface-3 p-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.4fr)_32px] md:bg-transparent md:p-0">
      <Select label="Rule field" value={c.field} onChange={(f) => onChange(defaultCondition(f as FieldKey))}>
        {ADDABLE_FIELDS.map((f) => (
          <option key={f} value={f}>
            {FIELD_LABELS[f]}
          </option>
        ))}
      </Select>
      <Operator c={c} onChange={onChange} />
      {wide ? (
        <span className="hidden min-w-0 md:col-start-3 md:row-start-1 md:block">
          <Static>
            <span className="truncate">{wideSummary(c)}</span>
          </Static>
        </span>
      ) : null}
      <div className={`col-span-3 row-start-2 min-w-0 ${wide ? 'md:col-span-3 md:col-start-1 md:rounded-card md:bg-surface-3/50 md:px-2.5 md:py-1.5' : 'md:col-span-1 md:col-start-3 md:row-start-1'}`}>
        <Value c={c} hints={hints} onChange={onChange} />
      </div>
      <RemoveButton label={`Remove ${label.toLowerCase()} rule`} onClick={onRemove} className="col-start-3 row-start-1 mt-1 md:col-start-4" />
    </div>
  );
}

function inOutMode(c: InOutField): 'in' | 'notIn' {
  return c.in === undefined && c.notIn !== undefined ? 'notIn' : 'in';
}

function Operator({ c, onChange }: { c: Condition; onChange: (c: Condition) => void }) {
  switch (c.field) {
    case 'genre':
    case 'mood':
    case 'theme':
    case 'tag':
    case 'artist': {
      const mode = inOutMode(c);
      return (
        <Select
          label="Match type"
          value={mode}
          onChange={(m) => {
            const list = (c[mode] ?? []) as string[];
            const next = { ...c, in: undefined, notIn: undefined, [m]: list };
            onChange(next as Condition);
          }}
        >
          <option value="in">is any of</option>
          <option value="notIn">is none of</option>
        </Select>
      );
    }
    case 'explicit':
      return (
        <Select label="Clean or explicit" value={c.is ? 'explicit' : 'clean'} onChange={(v) => onChange({ field: 'explicit', is: v === 'explicit' })}>
          <option value="clean">Clean only</option>
          <option value="explicit">Explicit only</option>
        </Select>
      );
    case 'addedAt':
      return (
        <Select
          label="Before or after"
          value={c.before !== undefined && c.after === undefined ? 'before' : 'after'}
          onChange={(v) => onChange({ field: 'addedAt', [v]: c.after ?? c.before ?? new Date().toISOString().slice(0, 10) })}
        >
          <option value="after">after</option>
          <option value="before">before</option>
        </Select>
      );
    case 'decade':
    case 'camelot':
      return <Static>is any of</Static>;
    default:
      return <Static>is between</Static>;
  }
}

function Value({ c, hints, onChange }: { c: Condition; hints: RuleHints; onChange: (c: Condition) => void }) {
  switch (c.field) {
    case 'genre': {
      const mode = inOutMode(c);
      const options = [...GENRE_BUCKETS.map((b) => GENRE_LABELS[b]), ...hints.genres];
      return (
        <TokenInput
          label="Genres"
          values={c[mode] ?? []}
          onChange={(v) => onChange({ ...c, [mode]: v })}
          display={genreLabel}
          normalize={genreValue}
          options={options}
          placeholder="Add a genre…"
        />
      );
    }
    case 'tag': {
      const mode = inOutMode(c);
      return (
        <TokenInput label="Tags" values={c[mode] ?? []} onChange={(v) => onChange({ ...c, [mode]: v })} display={(v) => v} normalize={(v) => v.trim().toLowerCase()} options={hints.tags} placeholder="Add a tag…" />
      );
    }
    case 'artist': {
      const mode = inOutMode(c);
      return (
        <TokenInput label="Artists" values={c[mode] ?? []} onChange={(v) => onChange({ ...c, [mode]: v })} display={(v) => v} normalize={(v) => v.trim()} options={hints.artists} placeholder="Add an artist…" />
      );
    }
    case 'mood': {
      const mode = inOutMode(c);
      return <ToggleGroup label="Moods" options={[...MOODS]} values={c[mode] ?? []} display={moodLabel} onChange={(v) => onChange({ ...c, [mode]: v })} />;
    }
    case 'theme': {
      const mode = inOutMode(c);
      return <ToggleGroup label="Themes" options={[...THEMES]} values={c[mode] ?? []} display={themeLabel} onChange={(v) => onChange({ ...c, [mode]: v })} />;
    }
    case 'decade':
      return <ToggleGroup label="Decades" options={DECADES} values={c.in} display={decadeName} onChange={(v) => onChange({ field: 'decade', in: v })} />;
    case 'camelot':
      return <KeyPicker values={c.in} onChange={(v) => onChange({ field: 'camelot', in: v })} />;
    case 'explicit':
      return <Static>{c.is ? 'Only songs marked explicit' : 'Leaves out explicit songs'}</Static>;
    case 'addedAt': {
      const key = c.before !== undefined && c.after === undefined ? 'before' : 'after';
      return (
        <input
          type="date"
          aria-label={`Added ${key}`}
          value={(c[key] ?? '').slice(0, 10)}
          onChange={(e) => onChange({ field: 'addedAt', [key]: e.target.value || undefined })}
          className={`${CELL} tnum w-full border border-transparent px-3 text-[14px] font-semibold text-text-1 focus:border-accent`}
        />
      );
    }
    case 'year':
      return <RangeInputs label="Release year" min={c.min} max={c.max} onChange={(min, max) => onChange({ field: 'year', min, max })} />;
    case 'bpm':
      return <RangeInputs label="BPM" min={c.min} max={c.max} onChange={(min, max) => onChange({ field: 'bpm', min, max })} />;
    default: {
      const field = c.field;
      return <RangeInputs label={FIELD_LABELS[field]} percent={PERCENT_FIELDS.has(field)} min={c.min} max={c.max} onChange={(min, max) => onChange({ field, min, max })} />;
    }
  }
}

function RangeInputs({ label, min, max, percent = false, onChange }: { label: string; min?: number; max?: number; percent?: boolean; onChange: (min?: number, max?: number) => void }) {
  const show = (v?: number) => (v === undefined ? '' : String(percent ? Math.round(v * 100) : v));
  const parse = (s: string): number | undefined => {
    if (s.trim() === '') return undefined;
    const n = Number(s);
    if (!Number.isFinite(n)) return undefined;
    return percent ? n / 100 : n;
  };
  const input = 'tnum h-full w-full min-w-0 bg-transparent px-1 text-center text-[14px] font-semibold text-text-1 placeholder:font-normal placeholder:text-text-3';
  return (
    <span className={`${CELL} flex items-center gap-1 px-2 focus-within:ring-1 focus-within:ring-accent`}>
      <input type="number" inputMode="numeric" aria-label={`${label} from`} placeholder="any" value={show(min)} onChange={(e) => onChange(parse(e.target.value), max)} className={input} />
      <span aria-hidden="true" className="text-text-3">
        –
      </span>
      <input type="number" inputMode="numeric" aria-label={`${label} to`} placeholder="any" value={show(max)} onChange={(e) => onChange(min, parse(e.target.value))} className={input} />
      {percent ? <span className="pr-1 text-[13px] text-text-3">%</span> : null}
    </span>
  );
}

function TokenInput({
  label,
  values,
  onChange,
  display,
  normalize,
  options,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  display: (v: string) => string;
  normalize: (v: string) => string;
  options: string[];
  placeholder: string;
}) {
  const [text, setText] = useState('');
  const listId = useId();
  const commit = () => {
    const v = normalize(text);
    if (v && !values.includes(v)) onChange([...values, v]);
    setText('');
  };
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1 rounded-card bg-bg px-1.5 py-1 focus-within:ring-1 focus-within:ring-accent md:bg-surface-3">
      {values.map((v) => (
        <span key={v} className="inline-flex items-center gap-0.5 rounded-pill bg-surface-3 py-[3px] pl-2.5 pr-1 text-[12px] font-semibold md:bg-bg">
          {display(v)}
          <button type="button" aria-label={`Remove ${display(v)}`} onClick={() => onChange(values.filter((x) => x !== v))} className="flex size-5 items-center justify-center rounded-pill text-text-2 hover:text-text-1">
            <XIcon size={11} strokeWidth={2.5} />
          </button>
        </span>
      ))}
      <input
        list={listId}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Backspace' && !text && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={commit}
        aria-label={label}
        placeholder={values.length ? 'Add…' : placeholder}
        className="h-7 min-w-[90px] flex-1 bg-transparent px-1.5 text-[13px] text-text-1 outline-none placeholder:text-text-3 focus-visible:outline-none"
      />
      <datalist id={listId}>
        {options.slice(0, 300).map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </div>
  );
}

function ToggleGroup<T extends string | number>({ label, options, values, display, onChange }: { label: string; options: T[]; values: T[]; display: (v: T) => string; onChange: (v: T[]) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5 py-1">
      {options.map((o) => {
        const on = values.includes(o);
        return (
          <button
            key={String(o)}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? values.filter((v) => v !== o) : [...values, o])}
            className={`h-8 rounded-pill px-3 text-[13px] font-semibold transition-colors duration-200 ${on ? 'bg-white text-bg' : 'border border-white/16 text-text-1 hover:border-white/40'}`}
          >
            {display(o)}
          </button>
        );
      })}
    </div>
  );
}

function KeyPicker({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const selected = new Set(values.map((v) => v.toUpperCase()));
  return (
    <div role="group" aria-label="Camelot keys" className="grid grid-cols-6 gap-1 py-1 sm:grid-cols-8">
      {CAMELOT_KEYS.map((k) => {
        const on = selected.has(k);
        const { bg, fg } = camelotColors(k);
        return (
          <button
            key={k}
            type="button"
            aria-pressed={on}
            aria-label={`${k}, ${camelotToKeyName(k)}`}
            onClick={() => onChange(on ? values.filter((v) => v.toUpperCase() !== k) : [...values, k])}
            className={`tnum h-7 rounded-pill text-[12px] font-bold transition-opacity duration-[120ms] ${on ? '' : 'border border-white/16 text-text-2 hover:text-text-1'}`}
            style={on ? { background: bg, color: fg } : undefined}
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}
