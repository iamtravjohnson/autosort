import type { Metadata } from 'next';
import { RecipeFilter } from '@/components/content/recipe-filter';
import { RecipeCard } from '@/components/content/recipe-parts';
import { Breadcrumbs, JsonLd } from '@/components/seo';
import { ArrowRightIcon, GitHubIcon } from '@/components/icons';
import { QuickAnswer } from '@/components/ui';
import { RECIPE_CATEGORIES, recipeGroups, recipes } from '@/content/recipes';
import { pageMetadata } from '@/lib/seo';
import { absoluteUrl, site } from '@/lib/site';

const PATH = '/recipes';
const TITLE = 'Smart playlist recipes for Spotify';
const DESCRIPTION =
  'Ready-made smart playlist rules for Spotify: 90s Country, Clean Rap, Workout, Sad Songs, Harmonic Flow and more. Copy one into AutoSort and it keeps itself updated.';

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

/** Where a shared recipe ends up: the engine's built-in recipe list. */
const SHARE_URL = `${site.github}/blob/main/packages/core/src/recipes.ts`;

export default function RecipesPage() {
  const groups = RECIPE_CATEGORIES.filter((c) => recipes.some((r) => recipeGroups(r).includes(c)));

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-7 px-4 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
      <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'Recipes' }]} path={PATH} />

      <div className="flex max-w-[760px] flex-col gap-[18px]">
        <h1 className="m-0 text-[clamp(38px,5vw,60px)] font-extrabold leading-[1.04] tracking-[-0.035em]">{TITLE}</h1>
        <QuickAnswer>
          A recipe is a saved set of rules, like &ldquo;genre is Country and decade is 1990s&rdquo;. Import one into your AutoSort and it
          builds that playlist from your own library, then keeps it updated. Every recipe here is free to copy, change and share.
        </QuickAnswer>
      </div>

      <RecipeFilter
        groups={[...groups]}
        items={recipes.map((r) => ({ key: r.slug, groups: recipeGroups(r), card: <RecipeCard recipe={r} /> }))}
      />

      <section
        aria-labelledby="share-recipe"
        className="flex flex-wrap items-center justify-between gap-4 rounded-panel bg-surface-2 p-6"
      >
        <div className="flex flex-col gap-1">
          <h2 id="share-recipe" className="m-0 text-[19px] font-extrabold">
            Made a good one?
          </h2>
          <p className="m-0 text-[14px] text-text-2">
            Copy any recipe, change the rules, and open a pull request on GitHub to share it here.
          </p>
        </div>
        <a
          href={SHARE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-pill border border-white/30 px-5 text-[14px] font-bold text-text-1 no-underline transition-colors duration-[120ms] hover:border-white/60 hover:text-text-1"
        >
          <GitHubIcon size={16} />
          Share a recipe
          <ArrowRightIcon size={16} />
        </a>
      </section>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: TITLE,
          itemListElement: recipes.map((r, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: `${r.name} smart playlist recipe`,
            url: absoluteUrl(`/recipes/${r.slug}`),
          })),
        }}
      />
    </div>
  );
}
