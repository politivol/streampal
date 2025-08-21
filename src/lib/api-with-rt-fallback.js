// Enhanced API with RT scraper fallback
import { normalizeProviderName, US_STREAMING_PROVIDERS } from './providers.js';
import config from './config.js';

const TMDB_API_KEY = config.tmdbApiKey;
const OMDB_PROXY = config.omdbProxyUrl;
const SB_ANON = config.supabaseAnonKey;

// RT Scraper cache (in-memory for now)
const rtCache = new Map();
const RT_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

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

// RT Scraper functions
function cleanTitleForRT(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^the_/, '')
    .trim();
}

function getRTFromCache(title) {
  const cacheKey = cleanTitleForRT(title);
  const cached = rtCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp < RT_CACHE_EXPIRY)) {
    console.log(`🔄 Using cached RT data for: ${title}`);
    return cached.data;
  }
  
  return null;
}

function setRTCache(title, data) {
  const cacheKey = cleanTitleForRT(title);
  rtCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

async function scrapeRTScores(title, year = null) {
  try {
    console.log(`🍅 Attempting to scrape RT scores for: ${title}`);
    
    // Check cache first
    const cached = getRTFromCache(title);
    if (cached) {
      return cached;
    }

    // In a real implementation, you would need a CORS proxy
    // For now, this is a placeholder that shows the structure
    
    // Example of what the actual scraping would look like:
    /*
    const corsProxy = 'https://your-cors-proxy.com/';
    const searchUrl = `${corsProxy}https://www.rottentomatoes.com/search?search=${encodeURIComponent(title)}`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error('RT search failed');
    }
    
    const searchHtml = await searchResponse.text();
    const movieLinkMatch = searchHtml.match(/href="(\/m\/[^"]+)"/);
    
    if (movieLinkMatch) {
      const movieUrl = `${corsProxy}https://www.rottentomatoes.com${movieLinkMatch[1]}`;
      const movieResponse = await fetch(movieUrl);
      const movieHtml = await movieResponse.text();
      
      // Parse the HTML for scores
      const tomatometerMatch = movieHtml.match(/tomatometer[^>]*>(\d+)%/i);
      const audienceMatch = movieHtml.match(/audience[^>]*>(\d+)%/i);
      
      const scores = {
        tomatometer: tomatometerMatch ? parseInt(tomatometerMatch[1]) : null,
        audience_score: audienceMatch ? parseInt(audienceMatch[1]) : null,
        source: 'scraped'
      };
      
      setRTCache(title, scores);
      return scores;
    }
    */
    
    // For now, return null since we don't have a CORS proxy set up
    console.log('⚠️ RT scraping would require CORS proxy setup');
    return null;
    
  } catch (error) {
    console.error('RT scraping error:', error);
    return null;
  }
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
        const rt = omdbData?.Ratings?.find((r) => r.Source === 'Rotten Tomatoes')?.Value;
        rotten = rt ? parseInt(rt.replace('%', ''), 10) : null;
        
        if (rotten !== null) {
          console.log(`✅ OMDb RT score found: ${rotten}%`);
        }
      } else {
        console.log('⚠️ OMDb failed, trying RT scraper fallback...');
      }
    } catch (error) {
      console.log('⚠️ OMDb error, trying RT scraper fallback...', error.message);
    }
  }

  // If OMDb failed to get RT score, try scraping as fallback
  if (rotten === null) {
    try {
      const movieTitle = detailData.title || detailData.name;
      const releaseYear = detailData.release_date || detailData.first_air_date;
      const year = releaseYear ? new Date(releaseYear).getFullYear() : null;
      
      const scrapedScores = await scrapeRTScores(movieTitle, year);
      if (scrapedScores?.tomatometer !== null) {
        rotten = scrapedScores.tomatometer;
        console.log(`✅ Scraped RT score found: ${rotten}%`);
      }
    } catch (error) {
      console.log('⚠️ RT scraping also failed:', error.message);
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
    },
    streaming: providers,
    series,
    mediaType,
  };
}

// Cache management functions
export function getRTCacheStats() {
  const now = Date.now();
  const validEntries = Array.from(rtCache.values())
    .filter(entry => (now - entry.timestamp) < RT_CACHE_EXPIRY);
  
  return {
    totalEntries: rtCache.size,
    validEntries: validEntries.length,
    expiredEntries: rtCache.size - validEntries.length
  };
}

export function cleanRTCache() {
  const now = Date.now();
  const keysToDelete = [];
  
  for (const [key, entry] of rtCache.entries()) {
    if ((now - entry.timestamp) >= RT_CACHE_EXPIRY) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => rtCache.delete(key));
  console.log(`🧹 Cleaned ${keysToDelete.length} expired RT cache entries`);
  
  return keysToDelete.length;
}
