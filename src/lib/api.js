const TMDB_API_KEY = 'f653b3ff00c4561dfaebe995836a28e7';
const OMDB_PROXY = import.meta.env.VITE_OMDB_PROXY_URL;

function normalizeProviderName(name) {
  return name.replace(/\s+with ads/i, '').trim();
}

function extractProviders(watch) {
  const us = watch?.results?.US;
  if (!us) return [];
  const providerSet = new Set();
  const groups = ['flatrate', 'rent', 'buy', 'free', 'ads'];
  for (const g of groups) {
    for (const p of us[g] || []) {
      providerSet.add(normalizeProviderName(p.provider_name));
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
      const omdbRes = await fetch(url);
      if (omdbRes.ok) {
        omdbData = await omdbRes.json();
      }
    } else {
      // OMDb proxy not configured; skip OMDb fetch to avoid exposing keys in client
      // You can configure VITE_OMDB_PROXY_URL in the client environment to enable this.
      // console.warn('OMDB proxy not configured; skipping OMDb fetch');
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