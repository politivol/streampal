const TMDB_API_KEY = 'f653b3ff00c4561dfaebe995836a28e7';
const OMDB_PROXY = import.meta.env.VITE_OMDB_PROXY_URL;
const SB_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
          results.push({
            imdbID: ep.imdbID,
            title: `S${season}E${ep.Episode} - ${ep.Title}`,
          });
        }
      }
    }
    return results;
  }
  return [];
}
