import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ruleChips } from '@autosort/core';
import { CopyRecipeButton } from '@/components/content/copy-recipe-button';
import { chipsFor, coverGradient, coverInk, explainRule, orderExplain, orderLabel, orderShort } from '@/components/content/recipe-format';
import { HeaderChips, MiniChip, RecipeThumb, ruleSummary } from '@/components/content/recipe-parts';
import { MusicIcon } from '@/components/icons';
import { Breadcrumbs, JsonLd } from '@/components/seo';
import { ButtonLink, PreviewNotice, QuickAnswer, StepNumber } from '@/components/ui';
import { getRecipe, recipeGroups, recipeJson, recipes, type SiteRecipe } from '@/content/recipes';
import { howToJsonLd, pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return recipes.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) return {};
  return pageMetadata({
    title: `${recipe.name} smart playlist recipe`,
    description: `${recipe.name} smart playlist for Spotify: ${recipe.description} Copy the rules into AutoSort and the playlist keeps itself updated.`,
    path: `/recipes/${recipe.slug}`,
  });
}

function howToSteps(r: SiteRecipe) {
  return [
    { name: 'Copy the recipe', text: `Use Copy recipe to grab the ${r.name} rules as JSON, or import them into your AutoSort.` },
    { name: 'Pick your source', text: 'Point it at the playlist you save songs to, or at Liked Songs.' },
    { name: 'Save it to Spotify', text: `The playlist appears in Spotify as "${r.name} (AutoSort)" and fills with the songs that match.` },
    {
      name: 'Let it update',
      text: 'The daily sync adds new matches, removes songs that leave the source and keeps any songs you added by hand.',
    },
  ];
}

/** Five related recipes: same category first, then shared filter groups, then the rest in index order. */
function moreRecipes(r: SiteRecipe): SiteRecipe[] {
  const mine = recipeGroups(r);
  const score = (o: SiteRecipe) => (o.category === r.category ? 2 : 0) + recipeGroups(o).filter((g) => mine.includes(g)).length;
  return recipes
    .filter((o) => o.slug !== r.slug)
    .map((o, i) => ({ o, i, s: score(o) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, 5)
    .map(({ o }) => o);
}

const H2 = 'm-0 text-[28px] font-extrabold tracking-[-0.02em]';

export default async function RecipePage({ params }: Props) {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) notFound();

  const path = `/recipes/${recipe.slug}`;
  const h1 = `${recipe.name} smart playlist for Spotify`;
  const ink = coverInk(recipe.cover);
  const { chips, any } = chipsFor(recipe.rule);
  const rows = explainRule(recipe.rule);
  const steps = howToSteps(recipe);
  const json = recipeJson(recipe);

  return (
    <>
      <div className="mx-auto max-w-[1200px] px-4 pt-6 sm:px-6 sm:pt-8">
        <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'Recipes', href: '/recipes' }, { name: recipe.name }]} path={path} />
      </div>

      <header className="mx-auto flex max-w-[1200px] flex-wrap items-end gap-10 px-4 pb-8 pt-5 sm:px-6 sm:pb-12">
        <div
          aria-hidden="true"
          className="box-border flex size-[240px] shrink-0 flex-col justify-between rounded-card p-[22px] shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
          style={{ background: coverGradient(recipe.cover), color: ink }}
        >
          <MusicIcon size={34} />
          <span className="text-[28px] font-extrabold leading-none tracking-[-0.03em] sm:text-[36px]">{recipe.name}</span>
        </div>
        <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-4">
          <span className="text-[13px] font-bold text-accent-soft">Smart playlist recipe</span>
          <h1 className="m-0 text-[clamp(36px,4.6vw,56px)] font-extrabold leading-[1.04] tracking-[-0.035em]">{h1}</h1>
          <HeaderChips recipe={recipe} />
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={site.startPath} size="lg">
              Import into your AutoSort
            </ButtonLink>
            <CopyRecipeButton json={json} name={recipe.name} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1200px] flex-wrap items-start gap-8 px-4 pb-10 sm:px-6 sm:pb-14">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-8">
          <QuickAnswer>{recipe.quickAnswer}</QuickAnswer>

          <section aria-labelledby="who" className="flex flex-col gap-3">
            <h2 id="who" className={H2}>
              Who it&apos;s for
            </h2>
            <ul className="m-0 flex list-disc flex-col gap-2 pl-[22px] text-[16px] leading-[1.6] text-prose">
              {recipe.whoFor.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="shape" className="flex flex-col gap-3.5">
            <h2 id="shape" className={H2}>
              What the playlist looks like
            </h2>
            <p className="m-0 text-[15px] leading-[1.6] text-text-2">
              It&apos;s built from your own songs, so how big it gets depends on your library. These are the exact rules AutoSort
              checks, and the order it keeps the songs in.
            </p>
            <dl className="tnum m-0 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
              <div className="flex flex-col-reverse rounded-card bg-surface-1 p-4">
                <dt className="text-[13px] text-text-2">
                  {chips.length === 0 ? 'every song in the source' : any ? 'any one can match' : chips.length === 1 ? 'must match' : 'all must match'}
                </dt>
                <dd className="m-0 text-[28px] font-extrabold">
                  {chips.length === 0 ? 'No filter' : `${chips.length} ${chips.length === 1 ? 'rule' : 'rules'}`}
                </dd>
              </div>
              <div className="flex flex-col-reverse rounded-card bg-surface-1 p-4">
                <dt className="text-[13px] text-text-2">order inside the playlist</dt>
                <dd className="m-0 text-[28px] font-extrabold">{orderShort(recipe.order)}</dd>
              </div>
              <div className="flex flex-col-reverse rounded-card bg-surface-1 p-4">
                <dt className="text-[13px] text-text-2">new matches filed each sync</dt>
                <dd className="m-0 text-[28px] font-extrabold">Daily</dd>
              </div>
            </dl>

            <div className="flex flex-col gap-3 rounded-card bg-surface-1 p-[18px]">
              <h3 className="m-0 text-[14px] font-bold">How each rule is checked</h3>
              {rows.length > 1 ? (
                <p className="m-0 text-[13px] text-text-3">{any ? 'Any one of these is enough.' : 'A song needs all of these.'}</p>
              ) : null}
              <dl className="m-0 flex flex-col gap-3">
                {rows.length === 0 ? (
                  <div className="flex flex-col gap-1.5 border-t border-line pt-3 first:border-t-0 first:pt-0">
                    <dt>
                      <MiniChip>No rules</MiniChip>
                    </dt>
                    <dd className="m-0 text-[14px] leading-[1.55] text-text-2">Every song in your source playlist is included.</dd>
                  </div>
                ) : null}
                {rows.map((row) => (
                  <div key={row.chip} className="flex flex-col gap-1.5 border-t border-line pt-3 first:border-t-0 first:pt-0">
                    <dt>
                      <MiniChip>{row.chip}</MiniChip>
                    </dt>
                    <dd className="m-0 text-[14px] leading-[1.55] text-text-2">{row.how}</dd>
                  </div>
                ))}
                <div className="flex flex-col gap-1.5 border-t border-line pt-3">
                  <dt>
                    <MiniChip>Order: {orderLabel(recipe.order)}</MiniChip>
                  </dt>
                  <dd className="m-0 text-[14px] leading-[1.55] text-text-2">{orderExplain(recipe.order)}</dd>
                </div>
              </dl>
              <p className="m-0 text-[13px] leading-[1.5] text-text-3">
                Songs missing the data a rule needs don&apos;t match it. You can still pin or exclude any song by hand.
              </p>
            </div>

            <details className="group rounded-card border border-line">
              <summary className="flex items-center justify-between gap-4 px-4 py-3 text-[14px] font-bold">
                See the recipe JSON
                <span className="text-[13px] font-semibold text-text-3 group-open:hidden">Show</span>
                <span className="hidden text-[13px] font-semibold text-text-3 group-open:inline">Hide</span>
              </summary>
              <pre className="m-0 overflow-x-auto border-t border-line bg-surface-1 px-4 py-3 font-mono text-[13.5px] leading-[1.7] text-prose">
                <code>{json}</code>
              </pre>
            </details>
          </section>

          <section aria-labelledby="variations" className="flex flex-col gap-3">
            <h2 id="variations" className={H2}>
              Variations
            </h2>
            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 p-0">
              {recipe.variations.map((v) => (
                <li key={v.name} className="flex flex-col gap-2 rounded-card bg-surface-1 p-4">
                  <span className="text-[16px] font-bold">{v.name}</span>
                  <span className="flex flex-wrap gap-1.5">
                    {(v.add ? ruleChips({ match: 'all', conditions: v.add }) : []).map((c) => (
                      <MiniChip key={c}>+ {c}</MiniChip>
                    ))}
                    {v.order ? <MiniChip>Order: {orderLabel(v.order)}</MiniChip> : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="use" className="flex flex-col gap-4">
            <h2 id="use" className={H2}>
              How to use this recipe
            </h2>
            <ol className="m-0 flex list-none flex-col gap-4 p-0">
              {steps.map((s, i) => (
                <li key={s.name} className="flex gap-3.5">
                  <StepNumber n={i + 1} size={32} />
                  <span className="flex flex-col gap-0.5 pt-1">
                    <span className="text-[16px] font-bold">{s.name}</span>
                    <span className="text-[15px] leading-[1.6] text-text-2">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
            <PreviewNotice />
          </section>
        </div>

        <aside aria-labelledby="more-recipes" className="flex flex-[1_1_260px] flex-col gap-2.5">
          <h2 id="more-recipes" className="m-0 mb-1 text-[13px] font-bold uppercase tracking-[0.08em] text-text-3">
            More recipes
          </h2>
          {moreRecipes(recipe).map((m) => (
            <Link
              key={m.slug}
              href={`/recipes/${m.slug}`}
              className="flex items-center gap-3 rounded-card bg-surface-1 p-2.5 text-text-1 no-underline transition-colors duration-[120ms] hover:bg-surface-2 hover:text-text-1"
            >
              <RecipeThumb recipe={m} />
              <span className="flex min-w-0 flex-col">
                <span className="text-[15px] font-bold">{m.name}</span>
                <span className="text-[12px] text-text-2">{ruleSummary(m)}</span>
              </span>
            </Link>
          ))}
          <Link href="/recipes" className="mt-1 text-[14px] font-bold">
            All recipes →
          </Link>
        </aside>
      </div>

      <JsonLd
        data={howToJsonLd({
          name: `How to make a ${recipe.name} smart playlist on Spotify`,
          description: recipe.quickAnswer,
          steps,
        })}
      />
    </>
  );
}
