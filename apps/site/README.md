# autosort.app

The AutoSort website: landing page, split/sort feature pages, the Camelot wheel guide, free tools (Camelot converter, BPM & key finder), recipes, guides, comparisons and docs. Built from the AutoSort Claude Design canvas.

- Next.js 16 (App Router, Cache Components), Tailwind CSS v4, TypeScript
- Uses `@autosort/core` from this workspace for Camelot math and recipes
- `/api/track` looks up BPM and key for a Spotify track via ReccoBeats

```bash
pnpm --filter @autosort/core build   # the site imports the built engine
pnpm --filter @autosort/site dev
pnpm --filter @autosort/site build
```

Deployed on Vercel (project root `apps/site`; `vercel.json` builds the engine first).
