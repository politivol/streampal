import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const OMDB_KEY = Deno.env.get("OMDB_KEY");

if (!OMDB_KEY) {
  console.error("OMDB_KEY is not set");
}

serve(async (req) => {
  const origin = req.headers.get("origin") || "*";
  const headers = new Headers({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers });
  }

  if (!OMDB_KEY) {
    return new Response("Missing OMDB_KEY", { status: 500, headers });
  }

  const url = new URL(req.url);
  const params = url.searchParams;
  params.set("apikey", OMDB_KEY);

  const omdbUrl = `https://www.omdbapi.com/?${params.toString()}`;

  const res = await fetch(omdbUrl);
  const body = await res.text();

  headers.set("Content-Type", "application/json");
  return new Response(body, { status: res.status, headers });
});
