# Supabase Deployment

This project uses Supabase for database tables and edge functions.

## Database schema

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and log in.
2. Apply the schema:
   ```bash
   supabase db push
   ```
   or run the SQL file directly:
   ```bash
   psql < supabase/sql/schema.sql
   ```

## OMDb proxy function

1. Set the OMDb API key as a secret:
   ```bash
   supabase secrets set OMDB_KEY=YOUR_KEY
   ```
2. Deploy the function:
   ```bash
   supabase functions deploy omdb-proxy
   ```
3. To test locally:
   ```bash
   supabase functions serve omdb-proxy
   ```

Client code can use the deployed function via an environment variable:
```js
fetch(`${import.meta.env.VITE_OMDB_PROXY_URL}?t=The%20Matrix`)
```

The function proxies requests to the [OMDb API](https://www.omdbapi.com/) and
sets CORS headers allowing requests from `https://politivol.github.io/streampal/`.

## Rotten Tomatoes proxy function

This project includes an RT scraping proxy at `supabase/functions/rt-proxy`. It fetches HTML
from Rotten Tomatoes and returns it with appropriate CORS headers for the client-side scraper.

1. Deploy the function:
   ```bash
   supabase functions deploy rt-proxy
   ```
2. Set the client environment variable to point to the deployed function:
   - Local dev: add to `.env.local`
     ```env
     VITE_RT_PROXY_URL=https://<YOUR_PROJECT>.supabase.co/functions/v1/rt-proxy
     VITE_SUPABASE_ANON_KEY=<your anon key>
     ```
   - GitHub Pages build (if needed): configure these in your Pages build environment.

3. Verify quickly with a smoke test (optional):
   ```bash
   VITE_SUPABASE_ANON_KEY=<anon> \
   VITE_RT_PROXY_URL=https://<YOUR_PROJECT>.supabase.co/functions/v1/rt-proxy \
   npx vitest run scratch/rt-live.test.js
   ```
   Expected: returns at least one valid score (0–100) for a known title.
