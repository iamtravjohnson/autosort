import { DocsNote, DocsPage, DocsSection, DocsTable, P, QuickAnswer, Related, UL } from '@/components/docs/docs-ui';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

const PATH = '/docs/how-it-works';
const TITLE = 'How smart playlists work';
const DESCRIPTION =
  'How AutoSort’s smart playlists work: Autopilot, asking for a playlist in your own words, how genres are decided, the rule fields and their data sources, the daily sync, covers, unmatched songs, pins and excludes.';

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

const TOC = [
  { id: 'autopilot', label: 'Autopilot' },
  { id: 'ask', label: 'Ask for a playlist' },
  { id: 'genres', label: 'How genres are decided' },
  { id: 'rules', label: 'Rules' },
  { id: 'data', label: 'Where the data comes from' },
  { id: 'sync', label: 'Daily sync' },
  { id: 'covers', label: 'Covers' },
  { id: 'overrides', label: 'Unmatched, pins & removing' },
];

const RULE_FIELDS: Array<[string, string, string]> = [
  ['Genre', 'is any of Country, Americana', 'Last.fm tags for the song, its album and its artist, checked against how the song sounds'],
  ['Release year / decade', 'between 1990 and 1999', 'Spotify album release date, corrected to the original year by MusicBrainz'],
  ['Clean only', 'on', 'Spotify explicit flag'],
  ['Mood', 'is Happy', 'ReccoBeats audio (energy and valence), plus Last.fm tags'],
  ['Energy', 'between 70% and 100%', 'ReccoBeats audio'],
  ['BPM', 'between 120 and 150', 'ReccoBeats audio (tempo)'],
  ['Camelot key', 'is any of 8A, 9A', 'ReccoBeats audio (key and mode)'],
  ['Theme', 'is Love Songs', 'Last.fm tags for the song and album, plus words in the title (e.g. Christmas)'],
  ['Artist', 'is Chris Stapleton', 'Spotify'],
  ['Added to source', 'after Jan 1, 2025', 'When you added it to the source playlist'],
];

const ACCURACY: Array<[string, string, string]> = [
  ['Country', '94%', '0 of 101'],
  ['Rap', '92%', '3 of 85'],
  ['Rock', '88%', '10 of 137'],
  ['Latin', '86%', '0 of 50'],
  ['Pop', '79%', '0 of 181'],
  ['Worship', '76%', '0 of 37'],
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
    <DocsPage path={PATH} title={TITLE} meta="6 min" toc={TOC}>
      <QuickAnswer>
        A smart playlist is a normal Spotify playlist plus a set of rules. With Autopilot on, AutoSort reads your playlist and creates every
        smart playlist worth having (genres, decades, moods, love songs), then files new songs into them every day. You can also ask for one in
        your own words. A song goes in every playlist it fits, songs you delete stay out, and every sync can be undone.
      </QuickAnswer>

      <FlowDiagram />

      <DocsSection id="autopilot" title="Autopilot" size="xl">
        <P className="leading-[1.65]">
          Autopilot is on by default for each source. After AutoSort analyzes your playlist, it creates every smart playlist it recommends, and
          each night it adds new ones when your library grows into a new group (say, enough Christmas songs). Sizes scale with your library: for
          about 360 songs, a genre needs 11 songs, a decade or clean version 9, a theme like Love Songs 6 and a mood 18. Near-duplicates are
          skipped (Indie that&apos;s almost all Folk), and it stops at about 30 playlists.
        </P>
        <UL>
          <li>Delete a playlist Autopilot made and it won&apos;t make that one again.</li>
          <li>Turn Autopilot off on the source&apos;s page to pick suggestions yourself instead.</li>
        </UL>
      </DocsSection>

      <DocsSection id="ask" title="Ask for a playlist" size="xl">
        <P className="leading-[1.65]">
          On <strong>Smart Playlists</strong>, describe what you want: “90s country love songs”, “clean rap for the gym”, “slow songs”, “songs by
          Chris Stapleton”. AutoSort turns your words into rules, shows how many of your songs match and the newest few, and creates it when
          enough match. It understands genres, decades and years, moods, love, breakup and Christmas, clean, tempo, recently added, and any artist
          in your library.
        </P>
        <DocsNote tone="info" label="No AI">
          It&apos;s plain word matching that runs in your browser. Your request isn&apos;t sent to any AI service.
        </DocsNote>
      </DocsSection>

      <DocsSection id="genres" title="How genres are decided" size="xl">
        <P className="leading-[1.65]">
          Spotify no longer tells apps which genre an artist plays, so AutoSort works it out per song from Last.fm tags, in order of trust: the
          song&apos;s own tags, then its album&apos;s, then the main artist&apos;s. Featured artists barely count, and rap needs real rapping in
          the audio. That&apos;s how a rapper&apos;s country song stays out of your Rap playlist. When the evidence is thin, the song is left
          out rather than misfiled, and you can review it in Unmatched or the editor&apos;s optional “Maybe these too?” list. Every song shows a
          one-line reason, like “Album tagged country”.
        </P>
        <P className="leading-[1.65]">
          Accuracy is measured on Billboard genre-chart number ones (
          <a href={`${site.github}/blob/main/packages/core/eval/RESULTS.md`}>full results</a>):
        </P>
        <DocsTable head={['Playlist', 'Chart songs it caught', 'Wrong placements']} minWidth={480} rows={ACCURACY.map((r) => [...r])} />
      </DocsSection>

      <DocsSection id="rules" title="Rules" size="xl">
        <P className="leading-[1.65]">
          Each rule is a field, a condition and a value. Choose <strong>Match all</strong> to require every rule, or <strong>Any</strong> to
          accept songs that meet at least one. A song goes into every playlist whose rules it matches.
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
            <strong>Last.fm</strong> (free key, needed for genres): crowd tags for each song, album and artist. They decide genres and help
            themes and moods.
          </li>
          <li>
            <strong>ReccoBeats</strong> (free, no key): BPM, key and mode, energy, valence, danceability, acousticness and speechiness. Spotify
            closed its own audio-features endpoint to new apps in November 2024.
          </li>
          <li>
            <strong>MusicBrainz</strong>: the original release year, matched by ISRC, so a song on a “Greatest Hits” album still counts in its
            real decade.
          </li>
        </UL>
        <DocsNote tone="info" label="No AI">
          Spotify&apos;s Developer Policy forbids feeding Spotify data to AI models. Every smart playlist comes from rules you can read and
          edit.
        </DocsNote>
      </DocsSection>

      <DocsSection id="sync" title="Daily sync" size="xl">
        <UL>
          <li>
            <strong>Add new matches daily</strong>: on by default. New songs go in newest added first.
          </li>
          <li>
            <strong>Remove songs that leave the source</strong>: delete a song from the source and it leaves the smart playlist too.
          </li>
          <li>
            <strong>Songs you delete stay out</strong>: delete a song from a smart playlist in Spotify and AutoSort won&apos;t add it back.
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

      <DocsSection id="covers" title="Covers" size="xl">
        <P className="leading-[1.65]">
          Pick a style in <strong>Settings → Playlist covers</strong>:
        </P>
        <UL>
          <li>
            <strong>Album mosaic</strong> (default, free): Spotify makes the cover from four album covers in the playlist, and it updates as
            songs change.
          </li>
          <li>
            <strong>Photo</strong>: a photo picked for the playlist with its name, made with your OpenRouter key (about $0.13 each). Only the
            playlist&apos;s name and rule are sent.
          </li>
          <li>
            <strong>Designed</strong> (free): the playlist&apos;s color with its name in bold type.
          </li>
        </UL>
        <DocsNote tone="info" label="Why not artist photos?">
          Spotify&apos;s Developer Terms don&apos;t allow apps to make new images from cover art, so AutoSort never builds covers from album or
          artist images. The album mosaic is Spotify&apos;s own. Spotify doesn&apos;t let apps remove a cover, so switching existing playlists to
          album mosaics rebuilds them as fresh copies with the same songs.
        </DocsNote>
      </DocsSection>

      <DocsSection id="overrides" title="Unmatched songs, pins and removing songs" size="xl">
        <P className="leading-[1.65]">
          Songs that fit no rule wait in <strong>Unmatched</strong>. Add one to a playlist by hand and it becomes a <strong>pin</strong>: it
          stays even though it doesn&apos;t match. <strong>Exclude</strong> does the opposite and keeps a matching song out. Select songs and
          choose <strong>Remove from</strong> your source to delete them from the source playlist in Spotify, handy for versions Spotify no
          longer offers.
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
