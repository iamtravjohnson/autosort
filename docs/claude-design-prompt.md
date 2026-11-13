# Claude Design prompt: AutoSort

Copy everything below the line into Claude Design.

---

Design **AutoSort**: a free, open-source app that turns one big Spotify playlist into organized smart playlists that keep themselves up to date. It also sorts any playlist by BPM, musical key (Camelot wheel), energy and mood.

Design two things:
1. **The project website, autosort.app.** A public site with landing pages, setup docs, guides and free tools. It has to rank on Google and get quoted by AI answer engines.
2. **The self-hosted app.** Each person deploys their own copy (one click to Vercel), connects their own Spotify account, and can add up to 4 family members. All features are free; there are no plans, pricing or payments anywhere.

**The core story:** someone has spent years adding every song they love to one playlist called "Favs". They mostly hear only the newest songs at the top. AutoSort reads Favs and builds playlists like *Country*, *90s Country*, *Rap*, *Clean Rap*, *Worship*, *Workout*, *Happy*, *Sad* and *Love Songs*. Every day it files newly added songs into the right playlists, and it suggests new playlists when a new group emerges. The person keeps adding songs to Favs exactly as before.

**Tech:** both are built in Next.js + Tailwind CSS + shadcn/ui, so keep components systematic and reusable. The app screens will also be embedded as a page inside another dashboard app. Build them as self-contained panels that work with or without AutoSort's own sidebar, and show an "embedded" variant of the 3 main app screens.

## Visual direction: familiar like Spotify, but not a clone

- **Layout:** borrow the Spotify desktop/web app's layout language: a persistent left sidebar (Home, Smart Playlists, Sources, Sort, Activity, Settings, plus a "Your Playlists" list), a large rounded main panel, a header gradient that takes its color from the selected playlist's artwork, dense track tables, and card grids. The bottom bar shows sync/sort status and a "Save to Spotify" action, not a music player.
- **Dark-first:** near-black base `#0B0B0C`, surfaces `#141416` / `#1C1C1F` / `#26262A`, hairline borders `rgba(255,255,255,0.08)`, text `#FFFFFF` / `#B3B3B8` / `#6E6E76`. The docs also get a light theme.
- **Brand accent: anything except Spotify green.** Spotify's branding rules don't allow third-party apps to use its logo or brand color as their own or to imply affiliation. Use electric violet `#8B5CF6` (hover `#A78BFA`), or propose a better non-green accent.
- **Data palette:** the 12-hue Camelot wheel colors (positions 1–12). "A" (minor) keys use a deeper shade and "B" (major) keys a lighter one. Genre and mood charts need their own accessible categorical palette.
- **Type:** Figtree. Headlines are big and bold (700–800, tight tracking); body is 400/500. Use tabular numerals for BPM, durations and counts. JetBrains Mono for code in the docs.
- **Shape and motion:** pill buttons, 8px card radius, 4px radius on album art, generous 24/32px spacing. Signature motion: one tall playlist "fanning out" into several smart playlists.
- **Logo:** an "AutoSort" wordmark plus a mark of equalizer bars fanning out or arranged around a circle (a nod to the Camelot wheel). Show 3 options.

## Spotify compliance, shown in the UI

- Put "Works with Spotify" attribution with a Spotify logo placeholder wherever Spotify data (tracks, artwork, playlists) is shown. Every track and playlist gets an "Open in Spotify" link.
- Never crop, filter or overlay text on album art. Smart-playlist covers are AutoSort-generated graphics (gradient + icon + name), not edited album art.
- AutoSort doesn't play audio, so there are no play buttons. Use an "Open in Spotify" icon instead.
- Call the suggestion feature **"Smart suggestions"**; don't use the word "AI" in the UI.
- The footer disclaimer reads: "AutoSort is an independent open-source project, not affiliated with or endorsed by Spotify."

## 1. Design system (build this first)

Tokens (color, type scale, spacing, radius, shadow, motion), then components:
- Buttons: primary pill, secondary outline, ghost, icon, split button, **"Deploy to Vercel" button**, **GitHub button with star count**, **Sponsor button**
- Form controls: inputs, search, select, multi-select with chips, segmented control, tabs, toggle, range slider (BPM, energy, year), checkbox
- **Rule chip** (e.g. `Genre: Country`, `Decade: 1990s`, `Clean only`, `Mood: Happy`, `Key: 8A`) and a **rule builder row** (field → operator → value, with AND/OR)
- **Smart playlist card**: generated cover, name, rule chips, track count, source, "Synced 6h ago", "+5 today" badge, paused/error states
- **Source card** (e.g. Favs): track count, songs added this week, number of smart playlists fed, unmatched count
- **Camelot key chip** (e.g. `8A` in its wheel color) and **transition chip** (Perfect / Good / Energy boost / Clash)
- **Track row**: default, hover, selected, moved, pinned, excluded, missing data
- **Status checklist row**: done / missing / optional, with a fix-it link
- **Member row**: avatar, name, Spotify email, status (Not added in Spotify yet / Invited / Connected)
- Charts: treemap (genres), bar chart (decades), energy × mood quadrant scatter, radial Camelot wheel, line/area curves
- Docs: code block with copy button, terminal snippet, numbered step block, callouts (tip / warning / important), env-var table, screenshot frame, prev/next links, docs sidebar and search
- Stat card, data table, accordion (FAQ), **"Quick answer" callout box**, comparison table with checkmarks
- Toast, modal, bottom sheet, banner, empty state, skeleton loaders, multi-step progress
- Breadcrumbs, sticky table of contents, author byline box, "Updated on" stamp, footer mega-menu

## 2. Project website: autosort.app

Rules for every page:
- One H1 that contains the target search phrase, plus visible breadcrumbs.
- Directly under the H1, a **"Quick answer" box** of 40–60 words that answers the query outright. Featured snippets and AI engines lift this.
- All content is real text, lists and HTML tables. Never put text inside images.
- Guides show an author byline with avatar and an "Updated {date}" stamp.
- An FAQ accordion at the bottom of most pages.
- Heavy internal linking: related features, recipes, guides, and a footer mega-menu that lists every page type.
- A small annotation (designer note, not user-visible) naming each page's structured data: SoftwareApplication / SoftwareSourceCode, FAQPage, HowTo, BreadcrumbList, Article.
- A matching Open Graph image template (1200×630) for each page type.

Target searches: "split spotify playlist by genre", "organize spotify liked songs", "spotify smart playlists", "auto sort spotify playlist", "open source spotify playlist organizer", "sort spotify playlist by bpm", "camelot wheel".

Pages:

1. **Home `/`**
   - Hero: H1 "Turn one giant Spotify playlist into perfectly organized ones". Sub: "AutoSort splits your playlist by genre, decade, mood and vibe, then keeps every playlist updated as you add songs. Free and open source. Runs on your own account in about 15 minutes." Primary CTA "Deploy your own"; secondary "View on GitHub ★ {stars}".
   - Hero visual: a "Favs · 2,431 songs" playlist fanning out into stacked smart playlists (Country 412, 90s Country 96, Clean Rap 141, Worship 88, Workout 230, Happy 318, Love Songs 205).
   - How it works in 3 steps: Create your free Spotify developer app → Deploy AutoSort with one click → Pick Favs and accept Smart suggestions.
   - Recipe gallery: ready-made smart playlists (Genre, Genre + decade, Clean versions, Moods, Workout 120–150 BPM, Harmonic flow).
   - "It keeps itself updated" section: a daily timeline ("6:00 AM: 14 new songs in Favs → 5 to Country, 4 to Workout…").
   - Why self-hosted: "Your data stays in your own database", "No subscription", "Share it with up to 4 family members".
   - Sort-modes grid, interactive Camelot wheel teaser, a comparison mini-table vs. Spotify Smart Reorder and other tools, FAQ, and a final CTA.
2. **Deploy / Get started `/start`**: the main conversion page.
   - What you need: a Spotify Premium account, a free GitHub account, a free Vercel account, a free database.
   - A time estimate, the "Deploy to Vercel" button, and links into the docs.
3. **Docs `/docs`**: a classic open-source docs layout with a left nav, search, right-side table of contents, and light/dark themes. Design these pages:
   - **Quick start**: numbered steps with screenshot frames, copy-able Redirect URI, and an env-var table.
   - **Create your Spotify developer app**: step-by-step, ~5 minutes.
   - **Add family members**: Spotify Dashboard → User Management, name + Spotify email, max 5 people per app.
   - **How smart playlists work**: rules, sync, unmatched songs.
   - **Updating your AutoSort**, **Troubleshooting** (e.g. "403: user not registered"), **FAQ**.
4. **Feature landing templates.** Design one of each family in full, and show one variant:
   - **Split pages** (full design: genre): `/split-spotify-playlist-by-genre`, plus `-by-decade`, `-by-mood`, `/clean-version-of-spotify-playlist`, `/organize-spotify-liked-songs`, `/spotify-smart-playlists`.
   - **Sort pages** (full design: BPM, with Key as the variant): `/sort-spotify-playlist-by-bpm`, plus `-by-key`, `-by-camelot`, `-by-energy`, `-by-date-added`, `-by-release-date`.
   - Each page has: H1, quick answer, how it works in AutoSort, use cases, an example before/after table, related pages, FAQ and CTA.
5. **Recipes `/recipes` and `/recipes/[slug]`**: shareable smart-playlist rule sets ("90s Country", "Clean Rap", "Sunday Worship", "Workout 120–150 BPM", "Sad Songs", "Love Songs").
   - Each recipe page shows its rules as chips, who it's for, an example tracklist shape, and an "Import into your AutoSort" button.
   - The recipes double as long-tail SEO pages.
6. **Camelot wheel guide `/camelot-wheel`** (pillar page)
   - Large interactive wheel: hovering a key highlights its compatible keys (same number, ±1, A↔B, +2 energy boost).
   - A full 24-key conversion table (Musical key / Camelot / Open Key).
   - Harmonic-mixing rules in plain English, a sticky table of contents, and an FAQ.
7. **Article template**, shown with "How to organize a huge Spotify playlist": table of contents, key-takeaways box, author box, inline CTA cards, related guides. Also a **guides index `/guides`**.
8. **Free tools**:
   - `/tools/camelot-converter`: pick a key → Camelot code + compatible keys.
   - `/tools/spotify-bpm-key-finder`: paste a Spotify track link → BPM, key, Camelot and energy.
9. **Comparison pages** `/vs/spotify-smart-reorder`, `/vs/free-your-music`, `/vs/skiley`, `/vs/playlistsorter`, `/vs/sortbytune` and `/alternatives/sort-your-music`: an honest feature table (include "open source" and "self-hosted" rows), "When to choose them / when to choose AutoSort", and an FAQ.
10. **Open source `/open-source`**: license, how to contribute, roadmap, contributors grid, and a GitHub Sponsors section.
11. **About `/about`**: the founder story ("I built this for my family's Favs playlists"), with a photo and a link to the founder's personal site (for E-E-A-T).
12. **Changelog / releases**, **Privacy**, **Terms**, **404**.

## 3. The self-hosted app

13. **First-run setup `/setup`**: shown until the instance is ready.
    - Status checklist: Spotify Client ID, Spotify Client Secret, Database connected, Daily sync scheduled, Last.fm key (optional, improves mood tags).
    - Each missing item has a fix-it link to the docs.
    - The exact Redirect URI to paste into Spotify, with a copy button.
    - Ends with "Connect your Spotify account" (becomes the owner).
14. **Connect Spotify `/connect`**: a plain-English permission list ("See your playlists", "Create and update playlists for you") and a big "Connect Spotify" button. Family members land here from the owner's invite link.
15. **Family `/app/family`** (owner only)
    - Members list, max 5 including the owner.
    - Add-member flow with 2 steps: (1) add them in your Spotify Developer Dashboard (deep link + what to type), (2) send them this invite link.
    - Statuses: not yet added in Spotify / invited / connected.
    - Each member gets their own sources and smart playlists.
16. **Onboarding: choose a source**
    - Pick the playlist to organize (e.g. Favs) or Liked Songs.
    - Analysis progress: "Reading 2,431 songs → genres → release years → BPM & key → moods".
17. **Source overview `/app/sources/[id]`**
    - The "aha" screen: what's inside Favs.
    - Charts: genre treemap, songs by decade, energy × mood quadrant (Happy / Sad / Chill / Intense), clean vs. explicit split, Camelot wheel distribution, and songs added per year.
18. **Smart suggestions**
    - Suggested playlists as selectable cards: name, rule chips, estimated song count, cover, and 3 sample tracks.
    - Primary button "Create 7 playlists in Spotify". Users can rename any card or adjust its rules first. Also "Import a recipe".
19. **Home `/app`**
    - Sources at the top (Favs: "synced 6h ago · 14 new songs filed today · 23 unmatched").
    - A grid of smart playlists grouped by source.
    - Below that, "Your other playlists" for one-off sorting.
20. **Smart playlist editor `/app/smart/[id]`**
    - Name, generated cover, and source(s).
    - **Rule builder**: genre is any of…, decade/year range, clean only, mood, energy range, BPM range, Camelot keys, and "added to source after…".
    - Live preview of matching tracks with a count.
    - **Order inside the playlist**: newest added first (default), BPM, energy arc, harmonic flow, release year.
    - **Sync options**: add new matches daily, remove songs that leave the source, keep songs I add manually.
    - **Manual overrides**: pin a song in, or exclude a song.
    - "Export as recipe".
21. **Unmatched songs**: songs in the source that fit no smart playlist, with "Add to…" and "Suggest a playlist for these".
22. **Playlist sort view `/app/playlist/[id]`** (one-off sorting of any owned playlist)
    - Header: artwork gradient, stats (tracks, total time, average BPM, key spread).
    - Sort toolbar: sort-mode picker, asc/desc, BPM range filter. **Harmonic mix** mode with a starting-key picker and BPM tolerance, and **energy-arc presets** (Warm-up → Peak → Cool-down, Steady, Build-up).
    - Track table columns: #, artwork + title + artist, album, BPM, Key (Camelot chip), Energy, Mood, Date added, Duration, Transition chip.
    - Row lock/pin, an **Original ↔ Sorted** toggle that highlights moved rows, and a **data coverage meter** ("BPM & key found for 287 of 300 tracks", with the data source named).
    - Sticky bottom bar: "Save to Spotify" split button (Reorder this playlist / Save as new playlist).
23. **Activity `/app/activity`**: a daily sync log ("Today 6:00 AM: 14 new songs in Favs → 5 Country, 2 90s Country, 4 Workout, 3 unmatched"), each run expandable, with **Undo / restore**.
24. **Saving progress and success**: big playlists save in batches. The success state has "Open in Spotify" and "Undo".
25. **Settings `/app/settings`**
    - Profile and connected Spotify account. Disconnecting deletes all stored Spotify data, and the UI says so.
    - Sync time and timezone, default order inside playlists.
    - Instance: version, "Update available" banner with a link to the update docs.
    - Data export, delete my data.
26. **States**
    - Table skeletons, empty library, session expired, rate-limited.
    - **"You're not on this AutoSort's Spotify user list"** (Spotify 403), with steps for the owner.
    - "You don't own this playlist": Spotify only exposes playlists you own or collaborate on, so followed playlists appear locked with a one-line explanation.
    - Missing data ("12 songs have no genre data"), offline.

## Mobile

Design every page at 1440 desktop and 390 mobile.
- The website collapses its docs nav into a drawer.
- The app follows Spotify mobile patterns: a bottom tab bar (Home, Smart Playlists, Activity, Settings), smart playlist cards in a 2-column grid, the rule builder in a bottom sheet, a compact track list (BPM + key chip only), and a sticky primary action.

## Content and tone

Short, confident, music-lover friendly; plain and precise in the docs. Use realistic sample data: a 2,431-song "Favs" playlist spanning country, 90s country, hip-hop, worship, pop, rock and R&B; BPMs from 70 to 174; all 24 Camelot keys; believable track and artist names (not real ones).

## Deliverable order

1. Design system
2. Key screens: Home, Docs quick start, First-run setup, Source overview + Smart suggestions, Smart playlist editor
3. Every remaining page above (desktop + mobile), including the embedded variants
4. OG image templates
