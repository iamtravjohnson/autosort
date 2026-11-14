import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { SiteRecipe } from '@/content/recipes';
import { chipsFor, coverGradient, orderLabel, splitChip } from './recipe-format';

/** Small pill used on recipe cards and variations (12/600 on surface-3). */
export function MiniChip({ children }: { children: ReactNode }) {
  return <span className="rounded-pill bg-surface-3 px-[9px] py-[3px] text-[12px] font-semibold text-text-1">{children}</span>;
}

/** "or" between chips of a match-any rule, so alternatives never read as all-required. */
function Or() {
  return <span className="self-center text-[12px] font-semibold text-text-3">or</span>;
}

/** Card chips: the rule's engine chips, plus the order when it isn't the default "newest added first". */
export function cardChips(r: SiteRecipe): { chips: string[]; any: boolean } {
  const { chips, any } = chipsFor(r.rule);
  const isDefault = r.order.by === 'addedAt' && r.order.direction !== 'asc';
  return { chips: isDefault && chips.length ? chips : [...chips, `Order: ${orderLabel(r.order)}`], any };
}

/** Rule summary as one line, e.g. "Genre: Rap · Clean only". */
export function ruleSummary(r: SiteRecipe): string {
  const { chips, any } = cardChips(r);
  if (!any) return chips.join(' · ');
  const order = chips.filter((c) => c.startsWith('Order: '));
  const rules = chips.filter((c) => !c.startsWith('Order: '));
  return [rules.join(' or '), ...order].join(' · ');
}

/** Recipe link card for the index grid. */
export function RecipeCard({ recipe }: { recipe: SiteRecipe }) {
  const { chips, any } = cardChips(recipe);
  const ruleCount = chips.filter((c) => !c.startsWith('Order: ')).length;
  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="flex h-full flex-col gap-3 rounded-card bg-surface-1 p-3.5 text-text-1 no-underline transition-colors duration-[120ms] hover:bg-surface-2 hover:text-text-1"
    >
      <div className="relative box-border flex aspect-[16/10] items-end overflow-hidden rounded-sm p-3.5" style={{ background: coverGradient(recipe.cover) }}>
        <Image src={`/images/recipes/${recipe.slug}.jpg`} alt="" fill sizes="(max-width: 640px) 100vw, 400px" className="object-cover" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" aria-hidden="true" />
        <h2 className="relative m-0 text-[24px] font-extrabold leading-none tracking-[-0.03em] text-white">{recipe.name}</h2>
      </div>
      <p className="m-0 text-[14px] leading-[1.45] text-text-2">{recipe.description}</p>
      <div className="mt-auto flex flex-wrap gap-1.5">
        {chips.map((c, i) => (
          <span key={c} className="contents">
            {any && i > 0 && i < ruleCount ? <Or /> : null}
            <MiniChip>{c}</MiniChip>
          </span>
        ))}
      </div>
    </Link>
  );
}

/** Square gradient thumb (48px) for "More recipes". */
export function RecipeThumb({ recipe, size = 48 }: { recipe: SiteRecipe; size?: number }) {
  return (
    <Image
      src={`/images/recipes/${recipe.slug}.jpg`}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-sm object-cover"
      style={{ background: coverGradient(recipe.cover) }}
    />
  );
}

/** Large rule chips for the recipe header: muted "Genre:" prefix + value (14/600, padding 6×12). */
export function HeaderChips({ recipe }: { recipe: SiteRecipe }) {
  const { chips, any } = chipsFor(recipe.rule);
  const all = [...(chips.length ? chips : ['Songs: Every song in the source']), `Order: ${orderLabel(recipe.order)}`];
  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Rules and order">
      {all.map((c, i) => {
        const { label, value } = splitChip(c);
        return (
          <li key={c} className="flex items-center gap-2">
            {any && i > 0 && i < chips.length ? <Or /> : null}
            <span className="rounded-pill bg-surface-3 px-3 py-1.5 text-[14px] font-semibold text-text-1">
              {label ? <span className="font-medium text-text-3">{label}: </span> : null}
              {value}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
