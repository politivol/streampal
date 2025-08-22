import { normalizeProviderName, US_STREAMING_PROVIDERS } from './providers.js';
import { rtClient } from './rt-client.js';
import config from './config.js';
import { handleDevError } from './devConfig.js';

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
  const page = Math.floor(Math.random() * 500) + 1;
  let res = await fetch(
    `https://api.themoviedb.org/3/trending/${mediaType}/${timeWindow}?api_key=${TMDB_API_KEY}&page=${page}`
  );
  let data = await res.json();
  if (!data.results?.length) {
    res = await fetch(
      `https://api.themoviedb.org/3/trending/${mediaType}/${timeWindow}?api_key=${TMDB_API_KEY}`
    );
    data = await res.json();
  }
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
  const base = `https://api.themoviedb.org/3/discover/${mediaType}?${params.toString()}`;
  let res = await fetch(`${base}&page=1`);
  let data = await res.json();
  const totalPages = Math.min(data.total_pages || 1, 500);
  const page = Math.floor(Math.random() * totalPages) + 1;
  if (page !== 1) {
    res = await fetch(`${base}&page=${page}`);
    data = await res.json();
  }
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
  let rotten = null;
  let rtSource = null;

  // Try OMDb first (existing method)
  if (imdbId && OMDB_PROXY) {
    try {
      const url = `${OMDB_PROXY.replace(/\/$/, '')}?i=${encodeURIComponent(imdbId)}&tomatoes=true`;
      const headers = {};
      if (SB_ANON) {
        headers.apikey = SB_ANON;
        headers.Authorization = `Bearer ${SB_ANON}`;
      }
      const omdbRes = await fetch(url, { headers });
      if (omdbRes.ok) {
        omdbData = await omdbRes.json();
        
        // Check if OMDb request was successful
        if (omdbData.Response !== 'False') {
          const rt = omdbData?.Ratings?.find((r) => r.Source === 'Rotten Tomatoes')?.Value;
          rotten = rt ? parseInt(rt.replace('%', ''), 10) : null;
          
          if (rotten !== null) {
            console.log(`✅ OMDb RT score found: ${rotten}%`);
            rtSource = 'omdb';
          }
        } else {
          console.log(`⚠️ OMDb returned error: ${omdbData.Error}`);
        }
      } else {
        console.log(`⚠️ OMDb proxy failed: ${omdbRes.status} ${omdbRes.statusText}`);
      }
    } catch (error) {
      handleDevError(error, 'OMDb API');
      console.log('⚠️ OMDb error, will try RT scraper fallback...');
    }
  }

  // If OMDb failed to get RT score, try scraping as fallback
  if (rotten === null) {
    try {
      const movieTitle = detailData.title || detailData.name;
      const releaseYear = detailData.release_date || detailData.first_air_date;
      const year = releaseYear ? new Date(releaseYear).getFullYear() : null;
      
      console.log(`🍅 Trying RT scraper fallback for: ${movieTitle}`);
      const scrapedScores = await rtClient.getScores(movieTitle, year);
      
      if (scrapedScores?.tomatometer !== null) {
        rotten = scrapedScores.tomatometer;
        rtSource = scrapedScores.source || 'scraped';
        console.log(`✅ ${rtSource === 'mock' ? 'Mock' : 'Scraped'} RT score found: ${rotten}%`);
      } else {
        console.log(`⚠️ RT scraper also failed for: ${movieTitle}`);
      }
    } catch (error) {
      handleDevError(error, 'RT Scraper Fallback');
    }
  }

  const providers = extractProviders(detailData['watch/providers']);
  
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
      rtSource: rtSource, // Track where RT score came from
    },
    streaming: providers,
    series,
    mediaType,
  };
}
