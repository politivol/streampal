import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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

  const url = new URL(req.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing 'url' parameter", { status: 400, headers });
  }

  // Validate that we only proxy Rotten Tomatoes
  if (!targetUrl.startsWith("https://www.rottentomatoes.com")) {
    return new Response("Only Rotten Tomatoes URLs allowed", { status: 403, headers });
  }

  try {
    // Add user agent to avoid being blocked
    const proxyHeaders = new Headers({
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      "DNT": "1",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    });

    const response = await fetch(targetUrl, {
      headers: proxyHeaders,
    });

    const body = await response.text();

    headers.set("Content-Type", "text/html");
    return new Response(body, { status: response.status, headers });

  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(`Proxy error: ${error.message}`, { status: 500, headers });
  }
});
