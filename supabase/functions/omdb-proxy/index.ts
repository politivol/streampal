import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const OMDB_KEY = Deno.env.get("OMDB_KEY");

const ALLOWED_ORIGINS = new Set([
  "https://politivol.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

const ALLOWED_PARAMS = new Set(["i", "t", "y", "type", "plot", "Season", "season"]);

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
  if (!OMDB_KEY) {
    return new Response("Missing OMDB_KEY", { status: 500, headers });
  }

  const url = new URL(req.url);
  const params = new URLSearchParams();
  for (const [key, value] of url.searchParams.entries()) {
    if (!ALLOWED_PARAMS.has(key)) continue;
    params.set(key, value);
  }
  params.set("apikey", OMDB_KEY);

  const upstream = await fetch(`https://www.omdbapi.com/?${params.toString()}`);
  const body = await upstream.text();
  headers.set("Content-Type", "application/json");
  return new Response(body, { status: upstream.status, headers });
});
