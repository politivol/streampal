import { normalizeProviderName, US_STREAMING_PROVIDERS } from './providers.js';
import config from './config.js';
import { tmdbFetch } from './tmdb.js';

const OMDB_PROXY = config.omdbProxyUrl;
const SB_ANON = config.supabaseAnonKey;

const genreCache = new Map();
const providerCache = new Map();
const detailCache = new Map();

function extractProviders(watch) {
  const us = watch?.results?.US;
  if (!us) return [];
  const providerSet = new Set();
  for (const group of ['flatrate', 'rent', 'buy', 'free', 'ads']) {
    for (const provider of us[group] || []) {
      const name = normalizeProviderName(provider.provider_name);
      if (US_STREAMING_PROVIDERS.includes(name)) providerSet.add(name);
    }
  }
  return Array.from(providerSet);
}

function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function genreIdMap(mediaType) {
  if (!genreCache.has(mediaType)) {
    const data = await tmdbFetch(`/genre/${mediaType}/list`);
    const map = {};
    for (const genre of data.genres || []) map[genre.name] = genre.id;
    genreCache.set(mediaType, map);
  }
  return genreCache.get(mediaType);
}

async function providerIdMap(mediaType) {
  if (!providerCache.has(mediaType)) {
    const data = await tmdbFetch(`/watch/providers/${mediaType}`, { watch_region: 'US' });
    const map = {};
    for (const provider of data.results || []) {
      map[normalizeProviderName(provider.provider_name)] = provider.provider_id;
    }
    providerCache.set(mediaType, map);
  }
  return providerCache.get(mediaType);
}

function mapTitles(results, mediaType) {
  return (results || []).map((item) => ({
    id: item.id,
    title: item.title || item.name || '',
    artwork: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
    mediaType: item.media_type || mediaType,
  }));
}

export async function searchTitles(query, mediaType = 'movie') {
  const type = mediaType === 'tv' ? 'tv' : 'movie';
  const data = await tmdbFetch(`/search/${type}`, { query });
  return mapTitles(data.results, type);
}

export async function discoverTitles(filters = {}) {
  const mediaType = filters.mediaType === 'tv' ? 'tv' : 'movie';
  const params = {
    sort_by: 'popularity.desc',
    include_adult: 'false',
    watch_region: 'US',
  };

  if (filters.genres?.length) {
    const map = await genreIdMap(mediaType);
    const ids = filters.genres.map((name) => map[name]).filter(Boolean);
    if (ids.length) params.with_genres = ids.join(',');
  }

  const providers = await providerIdMap(mediaType);
  if (filters.notStreaming) {
    const ids = US_STREAMING_PROVIDERS.map((name) => providers[name]).filter(Boolean);
    if (ids.length) params.without_watch_providers = ids.join('|');
  } else if (filters.providers?.length) {
    const ids = filters.providers.map((name) => providers[name]).filter(Boolean);
    if (ids.length) params.with_watch_providers = ids.join('|');
  }

  if (filters.minTmdb) params['vote_average.gte'] = filters.minTmdb;

  if (filters.releaseDate === 'past_year' || filters.releaseDate === 'older') {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    const dateKey = mediaType === 'tv' ? 'first_air_date' : 'primary_release_date';
    const bound = filters.releaseDate === 'past_year' ? 'gte' : 'lte';
    params[`${dateKey}.${bound}`] = isoDate(cutoff);
  }

  if (filters.randomPage) {
    params['vote_count.gte'] = 50;
    params.page = Math.floor(Math.random() * 20) + 1;
  }

  let data = await tmdbFetch(`/discover/${mediaType}`, params);
  if (filters.randomPage && !data.results?.length && params.page !== 1) {
    data = await tmdbFetch(`/discover/${mediaType}`, { ...params, page: 1 });
  }
  return mapTitles(data.results, mediaType);
}

function parseImdb(omdbData) {
  const value = omdbData?.Ratings?.find((rating) => rating.Source === 'Internet Movie Database')?.Value;
  if (!value || value === 'N/A') return null;
  const score = parseFloat(value);
  return Number.isFinite(score) ? score : null;
}

async function fetchOmdb(imdbId) {
  if (!imdbId || !OMDB_PROXY) return {};
  const url = `${OMDB_PROXY.replace(/\/$/, '')}?i=${encodeURIComponent(imdbId)}`;
  const headers = {};
  if (SB_ANON) {
    headers.apikey = SB_ANON;
    headers.Authorization = `Bearer ${SB_ANON}`;
  }
  const res = await fetch(url, { headers });
  if (res.ok === false) return {};
  const data = await res.json();
  if (data?.Response === 'False') return {};
  return data;
}

export async function fetchDetails(tmdbId, mediaType = 'movie') {
  const type = mediaType === 'tv' ? 'tv' : 'movie';
  const cacheKey = `${type}:${tmdbId}`;
  if (detailCache.has(cacheKey)) return detailCache.get(cacheKey);

  const detailData = await tmdbFetch(`/${type}/${tmdbId}`, {
    append_to_response: 'external_ids,watch/providers',
  });

  const imdbId = detailData.external_ids?.imdb_id;
  const omdbData = await fetchOmdb(imdbId).catch(() => ({}));

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

  const details = {
    id: detailData.id,
    title: detailData.title || detailData.name,
    artwork: detailData.poster_path ? `https://image.tmdb.org/t/p/w500${detailData.poster_path}` : null,
    releaseDate: detailData.release_date || detailData.first_air_date || null,
    runtime: detailData.runtime || detailData.episode_run_time?.[0] || null,
    genres: (detailData.genres || []).map((genre) => genre.name),
    ratings: {
      tmdb: detailData.vote_average,
      imdb: parseImdb(omdbData),
    },
    streaming: extractProviders(detailData['watch/providers']),
    series,
    mediaType: type,
  };
  detailCache.set(cacheKey, details);
  return details;
}
