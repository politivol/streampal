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
   supabase secrets set OMDB_API_KEY=YOUR_KEY
   ```
2. Deploy the function:
   ```bash
   supabase functions deploy omdb-proxy
   ```
3. To test locally:
   ```bash
   supabase functions serve omdb-proxy
   ```

The function proxies requests to the [OMDb API](https://www.omdbapi.com/) and
sets CORS headers allowing requests from `https://politivol.github.io/streampal/`.
