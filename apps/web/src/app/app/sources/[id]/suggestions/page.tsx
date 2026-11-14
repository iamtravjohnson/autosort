import { matchesRule, RECIPES, ruleChips, ruleKey, suggestPlaylists, type SuggestionKind, type TrackFacts } from '@autosort/core';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AnalyzeButton } from '@/components/editor/analyze-button';
import { SuggestionsPicker, type RecipeCard, type SuggestionCard } from '@/components/editor/suggestions-picker';
import { SpotifyLogo } from '@/components/ui';
import { coverGradient } from '@/lib/format';
import { getSource, userSmartPlaylists } from '@/lib/queries';
import { requireUser } from '@/lib/session';
import { fromSnapshot } from '@/lib/sync';

export const metadata: Metadata = { title: 'Smart suggestions' };

const KIND_LABEL: Record<SuggestionKind, string> = {
  genre: 'Genre',
  'genre-decade': 'Genre + decade',
  clean: 'Clean only',
  theme: 'Theme',
  mood: 'Mood',
};

const HEADER_BG = 'linear-gradient(180deg, #2E2350 0%, #141416 100%)';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function samplesOf(ids: string[], byId: Map<string, TrackFacts>): SuggestionCard['samples'] {
  return ids
    .map((id) => byId.get(id))
    .filter((t): t is TrackFacts => Boolean(t))
    .map((t) => ({ id: t.id, name: t.name, artist: t.artists.map((a) => a.name).join(', '), imageUrl: t.album.imageUrl }));
}

function newestIds(tracks: TrackFacts[], n: number): string[] {
  return [...tracks]
    .sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? ''))
    .slice(0, n)
    .map((t) => t.id);
}

export default async function SuggestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const source = await getSource(user.id, id);
  if (!source) notFound();

  const intro = (h1: string, lead: string) => (
    <>
      <nav aria-label="Breadcrumb" className="flex gap-2 text-[13px] text-text-2">
        <Link href={`/app/sources/${source.id}`} className="text-text-2 no-underline hover:text-text-1">
          {source.name}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-text-1" aria-current="page">
          Smart suggestions
        </span>
      </nav>
      <h1 className="m-0 max-w-[820px] text-[28px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[clamp(36px,4.5vw,56px)] sm:leading-[1.02] sm:tracking-[-0.035em]">{h1}</h1>
      <p className="m-0 max-w-[640px] text-[15px] leading-[1.55] text-text-2 sm:text-[16px]">{lead}</p>
    </>
  );

  if (!source.snapshot) {
    return (
      <div className="flex flex-col">
        <header className="flex flex-col gap-2.5 px-6 pb-7 pt-8 sm:px-8 sm:pt-12" style={{ background: HEADER_BG }}>
          {intro(`Let's see what's inside ${source.name}`, 'AutoSort reads your playlist and looks up each song’s genre, year, BPM and key. Then it suggests smart playlists.')}
        </header>
        <div className="flex flex-col gap-4 px-6 pb-8 sm:px-8">
          <div className="flex flex-col gap-4 rounded-card bg-surface-2 p-6">
            <h2 className="m-0 text-[18px] font-bold">Not analyzed yet</h2>
            <p className="m-0 max-w-[620px] text-[15px] leading-[1.6] text-text-2">
              AutoSort needs to read {source.name} before it can suggest playlists. Big playlists fill in over a few runs, so some songs may show up without data at first.
            </p>
            <AnalyzeButton sourceId={source.id} sourceName={source.name} />
          </div>
        </div>
      </div>
    );
  }

  const facts = source.snapshot.map(fromSnapshot);
  const byId = new Map(facts.map((t) => [t.id, t]));
  const existing = (await userSmartPlaylists(user.id)).filter((p) => p.sourceIds.includes(source.id));
  const existingKeys = new Set(existing.map((p) => ruleKey(p.rule)));
  const suggestions = suggestPlaylists(facts, { existingRules: existing.map((p) => p.rule) });

  const cards: SuggestionCard[] = suggestions.map((s) => ({
    key: s.key,
    name: s.name,
    kindLabel: KIND_LABEL[s.kind],
    count: s.count,
    chips: ruleChips(s.rule),
    cover: coverGradient(s.name),
    rule: s.rule,
    order: s.order,
    samples: samplesOf(s.sampleTrackIds, byId),
  }));

  const recipes: RecipeCard[] = RECIPES.map((r) => {
    const matched = facts.filter((t) => matchesRule(t, r.rule));
    const key = ruleKey(r.rule);
    return {
      key,
      slug: r.slug,
      name: r.name,
      description: r.description,
      kindLabel: 'Recipe',
      count: matched.length,
      chips: ruleChips(r.rule),
      cover: coverGradient(r.name),
      rule: r.rule,
      order: r.order,
      samples: samplesOf(newestIds(matched, 3), byId),
      exists: existingKeys.has(key),
    };
  });

  const rules = [...suggestions.map((s) => s.rule), ...existing.map((p) => p.rule)];
  const included = new Set(existing.flatMap((p) => p.include));
  const unmatchedCount = facts.filter((t) => !included.has(t.id) && !rules.some((r) => matchesRule(t, r))).length;

  const n = cards.length;
  const h1 = n ? `We found ${n} playlist${n === 1 ? '' : 's'} hiding in ${source.name}` : `No playlists hiding in ${source.name} yet`;

  return (
    <SuggestionsPicker
      intro={intro(h1, `Pick the ones you want and rename them if you like. They'll keep filling themselves as you add songs to ${source.name}.`)}
      headerBackground={HEADER_BG}
      source={{ id: source.id, name: source.name }}
      suggestions={cards}
      recipes={recipes}
      unmatchedCount={unmatchedCount}
      footer={
        <div className="flex justify-end pt-2">
          <SpotifyLogo width={78} />
        </div>
      }
    />
  );
}
