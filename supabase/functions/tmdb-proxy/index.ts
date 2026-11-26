import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const TMDB_KEY = Deno.env.get("TMDB_API_KEY");

const ALLOWED_ORIGINS = new Set([
  "https://politivol.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

const ALLOWED_PREFIXES = [
  "/trending/",
  "/search/",
  "/discover/",
  "/genre/",
  "/watch/",
  "/movie/",
  "/tv/",
  "/collection/",
];

const ALLOWED_PARAMS = new Set([
  "page",
  "query",
  "sort_by",
  "with_genres",
  "with_watch_providers",
  "without_watch_providers",
  "watch_region",
  "vote_average.gte",
  "vote_count.gte",
  "primary_release_date.gte",
  "primary_release_date.lte",
  "first_air_date.gte",
  "first_air_date.lte",
  "append_to_response",
  "language",
  "include_adult",
]);

function corsHeaders(req: Request) {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    Vary: "Origin",
  });
  const origin = req.headers.get("origin") || "";
  if (ALLOWED_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  return headers;
}

serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers });
  }
  if (!TMDB_KEY) {
    return new Response("Missing TMDB_API_KEY", { status: 500, headers });
  }

  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "";
  if (!path.startsWith("/") || path.includes("..") || path.includes("\\") || path.includes("://")) {
    return new Response("Bad path", { status: 400, headers });
  }
  if (!ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return new Response("Path not allowed", { status: 403, headers });
  }

  const params = new URLSearchParams();
  for (const [key, value] of url.searchParams.entries()) {
    if (key === "path" || key === "api_key" || key === "apikey") continue;
    if (!ALLOWED_PARAMS.has(key)) continue;
    params.set(key, value);
  }
  params.set("api_key", TMDB_KEY);

  const upstream = await fetch(`https://api.themoviedb.org/3${path}?${params.toString()}`);
  const body = await upstream.text();
  headers.set("Content-Type", "application/json");
  return new Response(body, { status: upstream.status, headers });
});
