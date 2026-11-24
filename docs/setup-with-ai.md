# Set up AutoSort with an AI assistant

If you'd rather have an AI walk you through setup, paste this into ChatGPT, Claude or Gemini:

```text
Help me set up my own copy of AutoSort, a free, open-source app that sorts one big Spotify playlist into smart playlists.

Read these first:
- https://autosort.app/llms.txt
- https://autosort.app/docs/quick-start

Then walk me through the setup one step at a time, and wait for me to finish each step before moving on:
1. Create a Spotify developer app (I have Spotify Premium) and get a free Last.fm API key.
2. Deploy AutoSort to Vercel with the Deploy button on https://autosort.app/start.
3. Add the Redirect URI to my Spotify app, then open my AutoSort and connect Spotify.

Tell me exactly what to click and what to pick on each screen. Never ask me to paste my Client Secret or API keys into this chat; tell me where to paste them instead. If something fails, help me fix it with https://autosort.app/docs/troubleshooting.
```

Keep your Spotify Client Secret and Last.fm key out of the chat. They go into Vercel's deploy form, not to the assistant.

Prefer to do it yourself? Follow the [quick start](https://autosort.app/docs/quick-start).
