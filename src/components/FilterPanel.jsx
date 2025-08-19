import { useEffect, useState } from 'react';

const TMDB_API_KEY = 'f653b3ff00c4561dfaebe995836a28e7';

function normalizeProviderName(name) {
  return name.replace(/\s+with ads/i, '').trim();
}

export default function FilterPanel({ filters = {}, onApply, onClose }) {
  const [mediaType, setMediaType] = useState(filters.mediaType || 'movie');
  const [genreOptions, setGenreOptions] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState(filters.genres || []);
  const [releaseDate, setReleaseDate] = useState(filters.releaseDate || 'any');
  const [providerOptions, setProviderOptions] = useState([]);
  const [providers, setProviders] = useState(filters.providers || []);
  const [seriesOnly, setSeriesOnly] = useState(filters.seriesOnly || false);
  const [minTmdb, setMinTmdb] = useState(filters.minTmdb || '');
  const [minRotten, setMinRotten] = useState(filters.minRotten || '');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [movieGenresRes, tvGenresRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}`),
          fetch(`https://api.themoviedb.org/3/genre/tv/list?api_key=${TMDB_API_KEY}`),
        ]);
        const movieGenres = await movieGenresRes.json();
        const tvGenres = await tvGenresRes.json();
        const combined = [...(movieGenres.genres || []), ...(tvGenres.genres || [])];
        const names = Array.from(new Set(combined.map((g) => g.name)));
        setGenreOptions(names);

        const provRes = await fetch(
          `https://api.themoviedb.org/3/watch/providers/movie?api_key=${TMDB_API_KEY}&watch_region=US`
        );
        const provData = await provRes.json();
        const provNames = (provData.results || []).map((p) => normalizeProviderName(p.provider_name));
        setProviderOptions(Array.from(new Set(provNames)));
      } catch (_) {
        // ignore
      }
    };
    fetchMeta();
    setOpen(true);
  }, []);

  const handleGenres = (e) => {
    setSelectedGenres(Array.from(e.target.selectedOptions, (o) => o.value));
  };

  const handleProviders = (e) => {
    setProviders(Array.from(e.target.selectedOptions, (o) => o.value));
  };

  const apply = () => {
    onApply?.({
      mediaType,
      genres: selectedGenres,
      releaseDate,
      providers,
      seriesOnly,
      minTmdb,
      minRotten,
    });
  };

  return (
    <aside className={`filter-panel ${open ? 'open' : ''}`}>
      <div className="row row--actions">
        <h3>Filters</h3>
        <button className="btn secondary" type="button" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="filter-group">
        <label>
          Media Type
          <select value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
            <option value="movie">Movie</option>
            <option value="tv">TV</option>
          </select>
        </label>
      </div>
      <div className="filter-group">
        <label>
          Genres
          <select multiple value={selectedGenres} onChange={handleGenres}>
            {genreOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="filter-group">
        <label>
          Release Date
          <select value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)}>
            <option value="any">Any</option>
            <option value="past_year">Past Year</option>
            <option value="older">Older</option>
          </select>
        </label>
      </div>
      <div className="filter-group">
        <label>
          Streaming Providers
          <select multiple value={providers} onChange={handleProviders}>
            {providerOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="filter-group">
        <label>
          <input
            type="checkbox"
            checked={seriesOnly}
            onChange={(e) => setSeriesOnly(e.target.checked)}
          />
          {' '}Series only
        </label>
      </div>
      <div className="filter-group">
        <label>
          Min TMDB Score
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={minTmdb}
            onChange={(e) => setMinTmdb(e.target.value)}
          />
        </label>
      </div>
      <div className="filter-group">
        <label>
          Min Rotten Tomatoes
          <input
            type="number"
            min="0"
            max="100"
            value={minRotten}
            onChange={(e) => setMinRotten(e.target.value)}
          />
        </label>
      </div>
      <button className="btn" type="button" onClick={apply}>
        Search
      </button>
    </aside>
  );
}
