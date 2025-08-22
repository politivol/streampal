# Streampal

## Local Setup

```bash
cp .env.example .env
npm i
npm run dev
```

## Deployment

Push to `main` triggers the workflow in [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).
It builds the site with Node 20, uploads the `dist` directory, and publishes to GitHub Pages.

## Supabase

- In your Supabase project settings, set the **Site URL** and **Auth redirect URL** to `https://politivol.github.io/streampal/`.
- Apply the database schema:
  ```bash
  supabase db push
  # or
  psql < supabase/sql/schema.sql
  ```
- Set the OMDb API key secret and deploy the edge function:
  ```bash
  supabase secrets set OMDB_KEY=YOUR_KEY
  supabase functions deploy omdb-proxy
  ```
- Client code should call the proxy function rather than OMDb directly:
  ```js
  fetch(`${import.meta.env.VITE_OMDB_PROXY_URL}?t=The%20Matrix`)
  ```

- Deploy the RT proxy function used for Rotten Tomatoes scraping:
  ```bash
  supabase functions deploy rt-proxy
  ```
  Then set in your environment (local `.env.local` or your hosting env):
  ```env
  VITE_RT_PROXY_URL=https://<YOUR_PROJECT>.supabase.co/functions/v1/rt-proxy
  VITE_SUPABASE_ANON_KEY=<your anon key>
  ```
