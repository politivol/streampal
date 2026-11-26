import config from './config.js';

export async function tmdbFetch(path, params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }

  let res;
  if (config.tmdbProxyUrl) {
    const base = config.tmdbProxyUrl.replace(/\/$/, '');
    const qs = search.toString();
    const url = `${base}?path=${encodeURIComponent(path)}${qs ? `&${qs}` : ''}`;
    const headers = {};
    if (config.supabaseAnonKey) {
      headers.apikey = config.supabaseAnonKey;
      headers.Authorization = `Bearer ${config.supabaseAnonKey}`;
    }
    res = await fetch(url, { headers });
  } else if (config.tmdbApiKey) {
    search.set('api_key', config.tmdbApiKey);
    res = await fetch(`https://api.themoviedb.org/3${path}?${search.toString()}`);
  } else {
    throw new Error('TMDB is not configured. Set VITE_TMDB_PROXY_URL or VITE_TMDB_API_KEY.');
  }

  const data = await res.json();
  if (res.ok === false) {
    throw new Error(data?.status_message || `TMDB request failed (${res.status})`);
  }
  return data;
}
