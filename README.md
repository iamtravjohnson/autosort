# AutoSort

**Turn one giant Spotify playlist into smart playlists that stay organized: by genre, decade, mood, BPM and Camelot key. Free, open source and self-hosted.**

Keep adding songs to the one playlist you always use (say, "Everything"). AutoSort reads it and keeps playlists like *Country*, *90s Country*, *Clean Rap*, *Worship*, *Workout* and *Love Songs* up to date every day. It can also sort any playlist by BPM, energy, or harmonically around the Camelot wheel.

Website: [autosort.app](https://autosort.app) · Made by [Travis Johnson](https://travisjohnson.com) ([@iamtravjohnson](https://x.com/iamtravjohnson))

> **Status:** early release. Deploy your own copy from [autosort.app/start](https://autosort.app/start). Changelog: [autosort.app/changelog](https://autosort.app/changelog)

## What it does

- **Autopilot** (on by default): reads your playlist and creates every smart playlist worth having, sized to your library, then adds new ones as it grows. Delete one and it stays gone.
- **Ask for a playlist** in your own words, like "90s country love songs" or "clean rap for the gym".
- **Accurate genres** from each song's own Last.fm tags, then its album's and artist's, checked against the audio. [Measured on Billboard chart number ones](packages/core/eval/RESULTS.md).
- A song goes in **every playlist it fits**. Songs you delete from a smart playlist stay out. Every sync can be undone.
- **Covers**: Spotify's own album mosaic by default, or optional photo covers.
- **Sort** any playlist by BPM, energy or harmonically around the Camelot wheel.

## Why self-hosted?

Since 2026, Spotify limits new developer apps to 5 users. So AutoSort runs as **your own copy** with **your own free Spotify developer app**: you plus up to 4 family members. Your data stays in your own database.

## What's here

| Path | What it is |
|---|---|
| [`packages/core`](packages/core) | The engine: Spotify client, data lookups, rules, smart-playlist suggestions, sorting (BPM, key, Camelot, energy arcs) and the daily sync planner. No framework or database. |
| [`apps/web`](apps/web) | The self-hosted app (Next.js + Postgres), with one-click deploy to Vercel. |
| [`apps/site`](apps/site) | The autosort.app website and docs. |

## Where the data comes from

| Data | Source |
|---|---|
| Your playlists, songs, explicit flag, release date | Spotify Web API (your account) |
| BPM, key, energy, mood (valence), danceability | [ReccoBeats](https://reccobeats.com) (free, no key) |
| Original release year (fixes "Greatest Hits" dates) | [MusicBrainz](https://musicbrainz.org) |
| Genres and crowd tags (country, rap, worship, love songs, sad…) for each song, album and artist | [Last.fm](https://www.last.fm/api) (free key, needed for genre playlists) |

AutoSort doesn't send Spotify data to AI models: Spotify's Developer Policy doesn't allow it. Smart playlists are built from transparent rules you can see and edit.

## Development

```bash
pnpm install
pnpm test        # unit tests
pnpm typecheck
pnpm smoke       # live check of ReccoBeats + MusicBrainz (no keys needed)
```

## License

[MIT](LICENSE). AutoSort is an independent open-source project, not affiliated with or endorsed by Spotify.
