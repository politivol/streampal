import config from './config.js';
import { tmdbFetch } from './tmdb.js';

const OMDB_PROXY = config.omdbProxyUrl;
const SB_ANON = config.supabaseAnonKey;

export async function fetchSeriesEntries(series) {
  if (!series) return [];
  if (series.type === 'tmdb' && series.id) {
    const data = await tmdbFetch(`/collection/${series.id}`);
    const parts = data.parts || [];
    return parts
      .filter((part) => part.release_date)
      .sort((a, b) => new Date(a.release_date) - new Date(b.release_date))
      .map((part) => ({ id: part.id, title: part.title || part.name, releaseDate: part.release_date }));
  }
  if (series.type === 'omdb' && series.imdbId && OMDB_PROXY) {
    const results = [];
    const total = Number(series.totalSeasons) || 0;
    for (let season = 1; season <= total; season++) {
      const url = `${OMDB_PROXY.replace(/\/$/, '')}?i=${encodeURIComponent(series.imdbId)}&Season=${season}`;
      const res = await fetch(url, {
        headers: {
          apikey: SB_ANON || '',
          Authorization: SB_ANON ? `Bearer ${SB_ANON}` : '',
        },
      });
      const data = await res.json();
      if (data?.Episodes) {
        for (const episode of data.Episodes) {
          const released = episode.Released && episode.Released !== 'N/A' ? episode.Released : null;
          results.push({
            imdbID: episode.imdbID,
            title: `S${season}E${episode.Episode} - ${episode.Title}`,
            releaseDate: released,
          });
        }
      }
    }
    return results.sort((a, b) => {
      const left = a.releaseDate ? new Date(a.releaseDate) : 0;
      const right = b.releaseDate ? new Date(b.releaseDate) : 0;
      return left - right;
    });
  }
  return [];
}
