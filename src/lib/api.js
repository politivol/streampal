const TMDB_API_KEY = 'f653b3ff00c4561dfaebe995836a28e7';
const OMDB_API_KEY = '84da1316';

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
    const omdbRes = await fetch(`http://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}`);
    omdbData = await omdbRes.json();
  }

  const providers = extractProviders(detailData['watch/providers']);
  const rt = omdbData?.Ratings?.find((r) => r.Source === 'Rotten Tomatoes')?.Value;
  const rotten = rt ? parseInt(rt.replace('%', ''), 10) : null;

  let series = null;
  if (detailData.belongs_to_collection) {
    series = {
      id: detailData.belongs_to_collection.id,
      name: detailData.belongs_to_collection.name,
    };
  } else if (omdbData.Type === 'series') {
    series = {
      name: omdbData.Title,
      totalSeasons: omdbData.totalSeasons,
    };
  }

  return {
    id: detailData.id,
    title: detailData.title || detailData.name,
    artwork: detailData.poster_path ? `https://image.tmdb.org/t/p/w500${detailData.poster_path}` : null,
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
