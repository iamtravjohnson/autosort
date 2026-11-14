import { DocsNote, DocsPage, DocsSection, DocsTable, P, QuickAnswer, Related, UL } from '@/components/docs/docs-ui';
import { pageMetadata } from '@/lib/seo';

const PATH = '/docs/how-it-works';
const TITLE = 'How smart playlists work';
const DESCRIPTION =
  'How AutoSort’s smart playlists work: the rule fields and the data behind each one (Spotify, ReccoBeats, MusicBrainz, Last.fm), the daily sync options, unmatched songs, pins and excludes.';

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

const TOC = [
  { id: 'rules', label: 'Rules' },
  { id: 'data', label: 'Where the data comes from' },
  { id: 'sync', label: 'Sync options' },
  { id: 'overrides', label: 'Unmatched & overrides' },
];

const RULE_FIELDS: Array<[string, string, string]> = [
  ['Genre', 'is any of Country, Americana', 'Last.fm tags for the song, its album and its artist, checked against how the song sounds (needs a free Last.fm key)'],
  ['Release year / decade', 'between 1990 and 1999', 'Spotify album release date, corrected to the original year by MusicBrainz'],
  ['Clean only', 'on', 'Spotify explicit flag'],
  ['Mood', 'is Happy', 'ReccoBeats audio: energy and valence'],
  ['Energy', 'between 70% and 100%', 'ReccoBeats audio'],
  ['BPM', 'between 120 and 150', 'ReccoBeats audio (tempo)'],
  ['Camelot key', 'is any of 8A, 9A', 'ReccoBeats audio (key and mode)'],
  ['Theme', 'is Love Songs', 'Last.fm crowd tags (optional free key)'],
  ['Added to source', 'after Jan 1, 2025', 'When you added it to the source playlist'],
];

function Arrow() {
  return (
    <svg width="28" height="16" viewBox="0 0 28 16" aria-hidden="true" className="shrink-0 rotate-90 self-center sm:rotate-0">
      <path d="M2 8h22M18 2l6 6-6 6" fill="none" stroke="var(--d-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlowDiagram() {
  return (
    <figure
      role="img"
      aria-label="Flow: songs added to your source playlist are checked against each playlist's rules every morning, then added to matching smart playlists or left in Unmatched"
      className="m-0 flex flex-col gap-3 rounded-[10px] border border-[var(--d-border)] bg-[var(--d-panel)] p-5 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <div className="flex flex-[1_1_140px] flex-col gap-1 rounded-card bg-[var(--d-surface-2)] p-3.5">
        <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--d-text-3)]">Source</span>
        <span className="text-[16px] font-extrabold">Everything</span>
        <span className="text-[13px] text-[var(--d-text-2)]">You add songs here</span>
      </div>
      <Arrow />
      <div className="flex flex-[1_1_140px] flex-col gap-1 rounded-card bg-[var(--d-tint)] p-3.5">
        <span className="tnum text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--d-accent-text)]">6:00 AM</span>
        <span className="text-[16px] font-extrabold">Rules check</span>
        <span className="text-[13px] text-[var(--d-text-2)]">Only new songs</span>
      </div>
      <Arrow />
      <div className="tnum flex flex-[1_1_160px] flex-col gap-1.5 text-[14px] font-bold">
        <span className="rounded-card bg-[var(--d-surface-2)] px-3 py-2">Country +5</span>
        <span className="rounded-card bg-[var(--d-surface-2)] px-3 py-2">Workout +4</span>
        <span className="rounded-card border border-dashed border-[var(--d-border-hover)] px-3 py-2 text-[var(--d-text-2)]">Unmatched 3</span>
      </div>
    </figure>
  );
}

export default function HowItWorksPage() {
  return (
    <DocsPage path={PATH} title={TITLE} meta="4 min" toc={TOC}>
      <QuickAnswer>
        A smart playlist is a normal Spotify playlist plus a set of rules. Once a day AutoSort checks new songs in your source against those
        rules and adds the matches. Songs that match nothing wait in Unmatched. You can pin songs in or exclude them by hand, and every sync
        can be undone.
      </QuickAnswer>

      <FlowDiagram />

      <DocsSection id="rules" title="Rules" size="xl">
        <P className="leading-[1.65]">
          Each rule is a field, a condition and a value. Choose <strong>Match all</strong> to require every rule, or <strong>Any</strong> to
          accept songs that meet at least one.
        </P>
        <DocsTable
          head={['Field', 'Example', 'Based on']}
          minWidth={560}
          rows={RULE_FIELDS.map(([field, example, source]) => [
            field,
            <code key="e" className="text-[var(--d-accent-text)]">
              {example}
            </code>,
            source,
          ])}
        />
      </DocsSection>

      <DocsSection id="data" title="Where the data comes from" size="xl">
        <UL>
          <li>
            <strong>Spotify Web API</strong>: your playlists, the explicit flag and album release dates. (Spotify no longer shares artist genres with apps like AutoSort.)
          </li>
          <li>
            <strong>ReccoBeats</strong> (free, no key): BPM, key and mode, energy, valence, danceability and acousticness. Spotify closed its
            own audio-features endpoint to new apps in November 2024.
          </li>
          <li>
            <strong>MusicBrainz</strong>: the original release year, matched by ISRC, so a song on a “Greatest Hits” album still counts in its
            real decade.
          </li>
          <li>
            <strong>Last.fm</strong> (optional free key): crowd tags like “love songs” and “worship”, used for themes and to improve mood
            matches.
          </li>
        </UL>
        <DocsNote tone="info" label="No AI">
          Spotify&apos;s Developer Policy forbids feeding Spotify data to AI models. Every smart playlist comes from rules you can read and
          edit.
        </DocsNote>
      </DocsSection>

      <DocsSection id="sync" title="Sync options" size="xl">
        <UL>
          <li>
            <strong>Add new matches daily</strong>: on by default. New songs go in newest added first.
          </li>
          <li>
            <strong>Remove songs that leave the source</strong>: delete a song from the source and it leaves the smart playlist too.
          </li>
          <li>
            <strong>Keep songs I add manually</strong>: songs you add in Spotify stay, even if they don&apos;t match.
          </li>
        </UL>
        <P className="leading-[1.65]">
          Every sync is logged with Undo. The playlists AutoSort creates are named like “Country (AutoSort)” in Spotify.
        </P>
        <DocsNote tone="warning" label="Heads up">
          New playlists may show as public. Spotify currently ignores the private setting for apps in Development Mode, so make a playlist
          private in Spotify if you don&apos;t want it on your profile.
        </DocsNote>
      </DocsSection>

      <DocsSection id="overrides" title="Unmatched songs and overrides" size="xl">
        <P className="leading-[1.65]">
          Songs that fit no rule wait in <strong>Unmatched</strong>. Add one to a playlist by hand and it becomes a <strong>pin</strong>: it
          stays even though it doesn&apos;t match. <strong>Exclude</strong> does the opposite and keeps a matching song out.
        </P>
        <DocsNote tone="info" label="Tip">
          When several unmatched songs have something in common, AutoSort suggests a new playlist for them.
        </DocsNote>
      </DocsSection>

      <Related
        links={[
          { href: '/recipes', label: 'Playlist recipes' },
          { href: '/split/by-genre', label: 'Split by genre' },
          { href: '/sort/by-bpm', label: 'Sort by BPM' },
          { href: '/guides/camelot-wheel', label: 'The Camelot wheel' },
        ]}
      />
    </DocsPage>
  );
}
