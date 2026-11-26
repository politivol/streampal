import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// The old function was an open HTML proxy. It is intentionally disabled.
serve((req) => {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    Vary: "Origin",
  });
  const origin = req.headers.get("origin") || "";
  if (
    origin === "https://politivol.github.io" ||
    origin === "http://localhost:5173" ||
    origin === "http://127.0.0.1:5173"
  ) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  if (req.method === "OPTIONS") return new Response(null, { headers });
  headers.set("Content-Type", "text/plain");
  return new Response("Rotten Tomatoes proxy disabled", { status: 410, headers });
});
