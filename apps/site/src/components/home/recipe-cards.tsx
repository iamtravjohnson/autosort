import Link from 'next/link';
import { findRecipe, ruleChips, type OrderSpec, type Recipe } from '@autosort/core';

/** The six recipes featured on the home page, in design order, with their cover gradients. */
const FEATURED: Array<{ slug: string; cover: string }> = [
  { slug: 'country', cover: 'linear-gradient(145deg,#F59E0B,#7C2D12)' },
  { slug: '90s-country', cover: 'linear-gradient(145deg,#B45309,#451A03)' },
  { slug: 'clean-rap', cover: 'linear-gradient(145deg,#38BDF8,#1E3A8A)' },
  { slug: 'happy', cover: 'linear-gradient(145deg,#FBBF24,#F472B6)' },
  { slug: 'workout', cover: 'linear-gradient(145deg,#F97316,#7F1D1D)' },
  { slug: 'harmonic-flow', cover: 'linear-gradient(145deg,#8B5CF6,#1E1B4B)' },
];

/** A chip for any order other than the default "newest added first". */
function orderChip(order: OrderSpec): string | null {
  switch (order.by) {
    case 'harmonic':
      return 'Order: Harmonic mix';
    case 'energyArc':
      return order.shape === 'build' ? 'Order: Energy build' : order.shape === 'mountain' ? 'Order: Warm-up → Peak' : 'Order: Wind-down';
    default:
      return null;
  }
}

function chipsFor(recipe: Recipe): string[] {
  const rules = ruleChips(recipe.rule);
  const order = orderChip(recipe.order);
  return [...(rules.length ? rules : ['Whole source']), ...(order ? [order] : [])].slice(0, 3);
}

/** Recipe link cards (cover, name, engine description, rule chips) → /recipes/<slug>. */
export function RecipeCards() {
  const recipes = FEATURED.flatMap(({ slug, cover }) => {
    const recipe = findRecipe(slug);
    return recipe ? [{ recipe, cover }] : [];
  });

  return (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-6 p-0">
      {recipes.map(({ recipe, cover }) => (
        <li key={recipe.slug} className="flex">
          <Link
            href={`/recipes/${recipe.slug}`}
            className="flex w-full gap-4 rounded-card bg-surface-2 p-4 text-text-1 no-underline transition-colors duration-[120ms] hover:bg-[#232327] hover:text-text-1"
          >
            <span className="size-[72px] shrink-0 rounded-sm sm:size-[88px]" style={{ background: cover }} aria-hidden="true" />
            <span className="flex min-w-0 flex-col gap-2">
              <span className="text-[17px] font-bold">{recipe.name}</span>
              <span className="text-[14px] leading-[1.4] text-text-2">{recipe.description}</span>
              <span className="flex flex-wrap gap-1.5">
                {chipsFor(recipe).map((c) => (
                  <span key={c} className="rounded-pill bg-surface-3 px-[9px] py-[3px] text-[12px] font-semibold">
                    {c}
                  </span>
                ))}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
