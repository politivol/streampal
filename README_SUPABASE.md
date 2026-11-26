# Supabase

## Schema

```bash
supabase db push
```

`0002_tighten_anon_defaults.sql` stops future `public` tables from being granted to `anon` automatically. Existing profile and list policies stay as they are.

## Functions

```bash
supabase secrets set TMDB_API_KEY=YOUR_TMDB_KEY OMDB_KEY=YOUR_OMDB_KEY
supabase functions deploy tmdb-proxy
supabase functions deploy omdb-proxy
supabase functions deploy rt-proxy
```

- `tmdb-proxy` holds the TMDB key. It only allows discover, search, movie, tv, genre, watch-provider, and collection paths. `verify_jwt` is on, so the caller must send the Supabase anon key.
- `omdb-proxy` only forwards `i`, `t`, `y`, `type`, `plot`, and `Season`. It does not accept an `apikey` from the browser. CORS is limited to GitHub Pages and local Vite, not whatever `Origin` the request claims.
- `rt-proxy` is disabled (HTTP 410). Redeploy it to shut the old HTML proxy.

Optional extra origins: `supabase secrets set ALLOWED_ORIGINS=https://example.com`

Client:

```env
VITE_TMDB_PROXY_URL=https://YOUR_PROJECT.supabase.co/functions/v1/tmdb-proxy
VITE_OMDB_PROXY_URL=https://YOUR_PROJECT.supabase.co/functions/v1/omdb-proxy
VITE_SUPABASE_ANON_KEY=your-anon-key
```
