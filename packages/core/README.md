# @autosort/core

The AutoSort engine: split a Spotify playlist into rule-based smart playlists, sort by BPM, key and the Camelot wheel, and keep everything in sync. Plain TypeScript, no framework or database; you bring token storage and a cache.

## Daily sync in one call

```ts
import { SpotifyClient, syncSmartPlaylists, RECIPES } from '@autosort/core';

const client = new SpotifyClient({ getAccessToken: () => getTokenFromYourDb() });

const result = await syncSmartPlaylists({
  client,
  sources: [{ type: 'playlist', id: FAVS_PLAYLIST_ID }],
  targets: savedDefinitions, // { id, name, rule, order, playlistId?, state? }
  enrich: { cache: yourCache, lastfm: null },
});

// Save each outcome's plan.nextState + playlistId, and previousUris as an undo point.
```

## Building blocks

- **Spotify:** `buildAuthorizeUrl`, `createPkcePair`, `exchangeCode`, `refreshTokens` and `SpotifyClient`, with retries and quota detection. The client covers:
  - Playlists: list, create, rename, cover upload.
  - Playlist items: add, replace, bulk-remove, move up/down (`moveItems` + `moveArgs`).
  - Liked Songs and library: read, save/remove (`saveToLibrary`, `removeFromLibrary`), and like with original dates (`saveTracksWithDates`).
- **Scopes:** `SPOTIFY_SCOPES` covers AutoSort's features; `SPOTIFY_ALL_SCOPES` grants full personal access. `missingScopes` shows what an existing connection lacks.
- **Data:** `enrichTracks` gathers ReccoBeats audio features, MusicBrainz original years and Last.fm tags for each song, album and artist. It is cached and runs within a budget, so a big library fills in over a few runs.
- **Genres:** `analyzeGenres` scores each genre from the song's own tags, then its album's, then its main artist's, and checks rap against how much rapping is in the audio. Featured artists barely count. When the evidence is thin the song gets no genre (it's left out, not misfiled) and its likely genres go in `genreNear`. Every result has plain-English `genreReasons`. Spotify no longer returns artist genres to most apps, so the old Spotify step is off by default.
- **Rules:** `matchesRule`, `parseRule` (zod), `ruleChips` ("Genre: Country", "Clean only").
- **Suggestions:** `suggestPlaylists` proposes Country, 90s Country, Clean Rap, Worship, Love Songs, Workout…; `unmatchedTracks` lists songs no rule claims.
- **Sorting:** `sortTracks` by any field, `harmonic` (Camelot + BPM), `energyArc`, seeded `shuffle`, with pinned positions.
- **Camelot:** `toCamelot`, `transition`, `compatibleKeys`, `camelotTable`.
- **Sync:** `planSmartPlaylist` (pure, idempotent) and `applyChange` / `restorePlaylist`.
- **Recipes:** built-in rule sets in `RECIPES`.
