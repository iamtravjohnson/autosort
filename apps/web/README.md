# AutoSort (self-hosted app)

Your own copy of AutoSort: point it at the Spotify playlist you always add to, and it keeps smart playlists like Country, 90s Country, Clean Rap, Worship, Workout and Love Songs organized every day. It also sorts any playlist by BPM, key (Camelot wheel) or energy.

Free and open source (MIT). Up to 5 people per copy (Spotify's limit for developer apps). Guide: [autosort.app/docs/quick-start](https://autosort.app/docs/quick-start)

## Deploy

1. Create a Spotify developer app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) (Web API only). You need Spotify Premium.
2. Click **Deploy to Vercel** on [autosort.app/start](https://autosort.app/start). Paste your Client ID and Client Secret. Vercel creates the database for you.
3. In your Spotify app, add the Redirect URI shown on your AutoSort's setup page: `https://<your-app>.vercel.app/api/auth/callback/spotify`.
4. Open your AutoSort and connect Spotify. The first person to connect is the owner and can invite up to 4 more.

## Update

In your repository on GitHub: **Actions → Update AutoSort → Run workflow**. It copies the latest AutoSort into your repo and Vercel redeploys. Your settings and data are kept; code changes you made are overwritten. Details: [autosort.app/docs/updating](https://autosort.app/docs/updating)

## Environment variables

| Name | Required | Notes |
|---|---|---|
| `SPOTIFY_CLIENT_ID` | Yes | From your Spotify app |
| `SPOTIFY_CLIENT_SECRET` | Yes | From your Spotify app |
| `DATABASE_URL` | Auto | Set by Vercel's Neon integration |
| `AUTH_SECRET` | No | Generated and stored in the database if unset |
| `CRON_SECRET` | No | Protects the daily sync endpoint |
| `LASTFM_API_KEY` | No | Better mood and theme playlists |
| `OPENROUTER_API_KEY` | No | Photo covers for new smart playlists (only the playlist's name and rule are sent) |
| `OPENROUTER_IMAGE_MODEL` | No | Image model, default `google/gemini-3-pro-image` |

## Run locally

```bash
cp .env.example .env.local   # fill in the Spotify keys and a local DATABASE_URL
npm install
npm run db:migrate
npm run dev                  # http://127.0.0.1:3000 (Spotify doesn't allow "localhost")
```

Add `http://127.0.0.1:3000/api/auth/callback/spotify` as a Redirect URI in your Spotify app.

AutoSort is an independent open-source project, not affiliated with or endorsed by Spotify.
