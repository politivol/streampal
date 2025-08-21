import { normalizeProviderName, US_STREAMING_PROVIDERS } from './providers.js';
import config from './config.js';

const TMDB_API_KEY = config.tmdbApiKey;
const OMDB_PROXY = config.omdbProxyUrl;
const SB_ANON = config.supabaseAnonKey;

function extractProviders(watch) {
  const us = watch?.results?.US;
  if (!us) return [];
  const providerSet = new Set();
  const groups = ['flatrate', 'rent', 'buy', 'free', 'ads'];
  for (const g of groups) {
    for (const p of us[g] || []) {
      const name = normalizeProviderName(p.provider_name);
      if (US_STREAMING_PROVIDERS.includes(name)) providerSet.add(name);
    }
  }
  return Array.from(providerSet);
}

export async function fetchTrending(mediaType, timeWindow = 'week') {
  const res = await fetch(`https://api.themoviedb.org/3/trending/${mediaType}/${timeWindow}?api_key=${TMDB_API_KEY}`);
  const data = await res.json();
  return (data.results || []).map((r) => ({
    id: r.id,
    title: r.title || r.name || '',
    artwork: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
    mediaType: r.media_type,
  }));
}

export async function searchTitles(query, mediaType = 'multi') {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/${mediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
  );
  const data = await res.json();
  return (data.results || []).map((r) => ({
    id: r.id,
    title: r.title || r.name || '',
    artwork: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
    mediaType: r.media_type || mediaType,
  }));
}

export async function discoverTitles(filters = {}) {
  const mediaType = filters.mediaType || 'movie';
  const params = new URLSearchParams();
  params.set('api_key', TMDB_API_KEY);
  params.set('sort_by', 'popularity.desc');

  const page = Math.floor(Math.random() * 500) + 1;
  params.set('page', page);

  if (filters.genres?.length) {
    try {
      const genreRes = await fetch(
        `https://api.themoviedb.org/3/genre/${mediaType}/list?api_key=${TMDB_API_KEY}`
      );
      const genreData = await genreRes.json();
      const map = {};
      for (const g of genreData.genres || []) map[g.name] = g.id;
      const ids = filters.genres.map((n) => map[n]).filter(Boolean);
      if (ids.length) params.set('with_genres', ids.join(','));
    } catch (_) {
      // ignore genre errors
    }
  }

  if (filters.providers?.length) {
    try {
      const provRes = await fetch(
        `https://api.themoviedb.org/3/watch/providers/${mediaType}?api_key=${TMDB_API_KEY}&watch_region=US`
      );
      const provData = await provRes.json();
      const map = {};
      for (const p of provData.results || []) {
        const name = normalizeProviderName(p.provider_name);
        map[name] = p.provider_id;
      }
      const ids = filters.providers.map((n) => map[n]).filter(Boolean);
      if (ids.length) {
        params.set('with_watch_providers', ids.join(','));
        params.set('watch_region', 'US');
      }
    } catch (_) {
      // ignore provider errors
    }
  }

  if (filters.minTmdb) params.set('vote_average.gte', filters.minTmdb);

  const res = await fetch(
    `https://api.themoviedb.org/3/discover/${mediaType}?${params.toString()}`
  );
  const data = await res.json();
  return (data.results || []).map((r) => ({
    id: r.id,
    title: r.title || r.name || '',
    artwork: r.poster_path
      ? `https://image.tmdb.org/t/p/w500${r.poster_path}`
      : null,
    mediaType,
  }));
}

export async function fetchDetails(tmdbId) {
  const endpoints = ['movie', 'tv'];
  let detailData;
  let mediaType;
  for (const type of endpoints) {
    const res = await fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids,watch/providers`);
    if (res.ok) {
      detailData = await res.json();
      mediaType = type;
      break;
    }
  }
  if (!detailData) throw new Error('Not found');

  const imdbId = detailData.external_ids?.imdb_id;
  let omdbData = {};
  if (imdbId) {
    if (OMDB_PROXY) {
      // proxy must include the apikey server-side; we call the proxy via HTTPS
      const url = `${OMDB_PROXY.replace(/\/$/, '')}?i=${encodeURIComponent(imdbId)}`;
      const headers = {};
      if (SB_ANON) {
        headers.apikey = SB_ANON;
        headers.Authorization = `Bearer ${SB_ANON}`;
      }
      const omdbRes = await fetch(url, { headers });
      if (omdbRes.ok) {
        omdbData = await omdbRes.json();
      }
    } else {
      // OMDb proxy not configured; skip OMDb fetch to avoid exposing keys in client
    }
  }

  const providers = extractProviders(detailData['watch/providers']);
  const rt = omdbData?.Ratings?.find((r) => r.Source === 'Rotten Tomatoes')?.Value;
  const rotten = rt ? parseInt(rt.replace('%', ''), 10) : null;

  let series = null;
  if (detailData.belongs_to_collection) {
    series = {
      id: detailData.belongs_to_collection.id,
      name: detailData.belongs_to_collection.name,
      type: 'tmdb',
    };
  } else if (omdbData.Type === 'series') {
    series = {
      name: omdbData.Title,
      totalSeasons: omdbData.totalSeasons,
      imdbId,
      type: 'omdb',
    };
  }

  return {
    id: detailData.id,
    title: detailData.title || detailData.name,
    artwork: detailData.poster_path ? `https://image.tmdb.org/t/p/w500${detailData.poster_path}` : null,
    releaseDate: detailData.release_date || detailData.first_air_date || null,
    runtime: detailData.runtime || detailData.episode_run_time?.[0] || null,
    genres: (detailData.genres || []).map((g) => g.name),
    ratings: {
      tmdb: detailData.vote_average,
      rottenTomatoes: rotten,
    },
    streaming: providers,
    series,
    mediaType,
  };
}
