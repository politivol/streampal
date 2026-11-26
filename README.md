# Streampal

Movie and TV picker. Search or roll a random title, filter by service and year, then pin it or mark it seen.

## Local setup

```bash
cp .env.example .env
npm i
npm run dev
```

Put real values in `.env`. That file is gitignored. Do not commit it.

## What calls what

- The browser should call `VITE_TMDB_PROXY_URL` (Supabase function `tmdb-proxy`). `VITE_TMDB_API_KEY` is only a local fallback and ends up in the built JavaScript if you set it for the GitHub Pages build.
- OMDb is reached through `VITE_OMDB_PROXY_URL`. The function only accepts title/id lookups and requires the Supabase anon JWT.
- Scores shown are TMDB and IMDb. The Rotten Tomatoes scraper and its open proxy are removed.

## Deploy the functions

```bash
supabase secrets set TMDB_API_KEY=YOUR_TMDB_KEY OMDB_KEY=YOUR_OMDB_KEY
supabase functions deploy tmdb-proxy
supabase functions deploy omdb-proxy
supabase functions deploy rt-proxy
supabase db push
```

`rt-proxy` now returns 410. Redeploy it so the old open proxy is dead.

Then set the GitHub Actions secret `VITE_TMDB_PROXY_URL` to
`https://YOUR_PROJECT.supabase.co/functions/v1/tmdb-proxy`.
You can remove `VITE_TMDB_API_KEY` from the Pages build after that.

Auth redirect URL: `https://politivol.github.io/streampal/`.

## If keys were committed

`.env` used to be in this repo. Removing it does not erase git history. Rotate the TMDB key, the OMDb key, and the Supabase anon key, then purge the old commits if the repo was ever public (it is).
