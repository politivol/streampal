import config from './config.js';

const TMDB_API_KEY = config.tmdbApiKey;
const OMDB_PROXY = config.omdbProxyUrl;
const SB_ANON = config.supabaseAnonKey;

export async function fetchSeriesEntries(series) {
  if (!series) return [];
  if (series.type === 'tmdb' && series.id) {
    const res = await fetch(`https://api.themoviedb.org/3/collection/${series.id}?api_key=${TMDB_API_KEY}`);
    const data = await res.json();
    const parts = data.parts || [];
    return parts
      .filter((p) => p.release_date)
      .sort((a, b) => new Date(a.release_date) - new Date(b.release_date))
      .map((p) => ({ id: p.id, title: p.title || p.name, releaseDate: p.release_date }));
  }
  if (series.type === 'omdb' && series.imdbId) {
    const results = [];
    const total = Number(series.totalSeasons) || 0;
    for (let season = 1; season <= total; season++) {
      if (!OMDB_PROXY) {
        // Avoid calling OMDb from client when no proxy is configured
        break;
      }
      const url = `${OMDB_PROXY.replace(/\/$/, '')}?i=${encodeURIComponent(series.imdbId)}&Season=${season}`;
      const res = await fetch(url, {
        headers: {
          apikey: SB_ANON || '',
          Authorization: SB_ANON ? `Bearer ${SB_ANON}` : '',
        },
      });
      const data = await res.json();
      if (data?.Episodes) {
        for (const ep of data.Episodes) {
          const released = ep.Released && ep.Released !== 'N/A' ? ep.Released : null;
          results.push({
            imdbID: ep.imdbID,
            title: `S${season}E${ep.Episode} - ${ep.Title}`,
            releaseDate: released,
          });
        }
      }
    }
    return results.sort((a, b) => {
      const da = a.releaseDate ? new Date(a.releaseDate) : 0;
      const db = b.releaseDate ? new Date(b.releaseDate) : 0;
      return da - db;
    });
  }
  return [];
}
