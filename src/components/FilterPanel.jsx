import { useEffect, useState } from 'react';
import {
  normalizeProviderName,
  US_STREAMING_PROVIDERS,
} from '../lib/providers.js';
import config from '../lib/config.js';

const TMDB_API_KEY = config.tmdbApiKey;

export default function FilterPanel({ filters = {}, onApply, onClose }) {
  const [mediaType, setMediaType] = useState(filters.mediaType || 'movie');
  const [genreOptions, setGenreOptions] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState(filters.genres || []);
  const [genreSearch, setGenreSearch] = useState('');
  const [releaseDate, setReleaseDate] = useState(filters.releaseDate || 'any');
  const [providerOptions, setProviderOptions] = useState([]);
  const [providers, setProviders] = useState(filters.providers || []);
  const [providerSearch, setProviderSearch] = useState('');
  const [seriesOnly, setSeriesOnly] = useState(filters.seriesOnly || false);
  const [minTmdb, setMinTmdb] = useState(Number(filters.minTmdb) || 0);
  const [minRotten, setMinRotten] = useState(Number(filters.minRotten) || 0);
  const [open, setOpen] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchMeta = async () => {
      try {
        if (active) setLoadingMeta(true);
        const [movieGenresRes, tvGenresRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}`),
          fetch(`https://api.themoviedb.org/3/genre/tv/list?api_key=${TMDB_API_KEY}`),
        ]);
        if (!active) return;
        const movieGenres = await movieGenresRes.json();
        const tvGenres = await tvGenresRes.json();
        if (!active) return;
        const combined = [...(movieGenres.genres || []), ...(tvGenres.genres || [])];
        const names = Array.from(new Set(combined.map((g) => g.name)));
        if (active) setGenreOptions(names);

        const provRes = await fetch(
          `https://api.themoviedb.org/3/watch/providers/movie?api_key=${TMDB_API_KEY}&watch_region=US`
        );
        if (!active) return;
        const provData = await provRes.json();
        if (!active) return;
        const provNames = (provData.results || [])
          .map((p) => normalizeProviderName(p.provider_name))
          .filter((p) => US_STREAMING_PROVIDERS.includes(p));
        if (active) setProviderOptions(Array.from(new Set(provNames)));
      } catch (_) {
        // ignore
      } finally {
        if (active) setLoadingMeta(false);
      }
    };
    fetchMeta();
    setOpen(true);
    return () => {
      active = false;
    };
  }, []);

  const removeGenre = (g) => {
    setSelectedGenres((prev) => prev.filter((sg) => sg !== g));
  };

  const removeProvider = (p) => {
    setProviders((prev) => prev.filter((sp) => sp !== p));
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
        <sl-button variant="neutral" type="button" onClick={onClose}>
          Close
        </sl-button>
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
          <div className="multi-select">
            <input
              type="text"
              placeholder="Search genres"
              value={genreSearch}
              onChange={(e) => setGenreSearch(e.target.value)}
            />
            <div className="selected-tags">
              {selectedGenres.map((g) => (
                <sl-tag
                  key={g}
                  size="small"
                  removable
                  onSlRemove={() => removeGenre(g)}
                >
                  {g}
                </sl-tag>
              ))}
            </div>
            <div className="options">
              {loadingMeta ? (
                <div className="loading-spinner">
                  <sl-spinner></sl-spinner>
                </div>
              ) : (
                genreOptions
                  .filter((g) =>
                    g.toLowerCase().includes(genreSearch.toLowerCase())
                  )
                  .map((g) => (
                    <label key={g}>
                      <input
                        type="checkbox"
                        checked={selectedGenres.includes(g)}
                        onChange={(e) =>
                          e.target.checked
                            ? setSelectedGenres(prev => [...prev, g])
                            : removeGenre(g)
                        }
                      />
                      {g}
                    </label>
                  ))
              )}
            </div>
          </div>
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
          <div className="multi-select">
            <input
              type="text"
              placeholder="Search providers"
              value={providerSearch}
              onChange={(e) => setProviderSearch(e.target.value)}
            />
            <div className="selected-tags">
              {providers.map((p) => (
                <sl-tag
                  key={p}
                  size="small"
                  removable
                  onSlRemove={() => removeProvider(p)}
                >
                  {p}
                </sl-tag>
              ))}
            </div>
            <div className="options">
              {loadingMeta ? (
                <div className="loading-spinner">
                  <sl-spinner></sl-spinner>
                </div>
              ) : (
                providerOptions
                  .filter((p) =>
                    p.toLowerCase().includes(providerSearch.toLowerCase())
                  )
                  .map((p) => (
                    <label key={p}>
                      <input
                        type="checkbox"
                        checked={providers.includes(p)}
                        onChange={(e) =>
                          e.target.checked
                            ? setProviders(prev => [...prev, p])
                            : removeProvider(p)
                        }
                      />
                      {p}
                    </label>
                  ))
              )}
            </div>
          </div>
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
          <div className="slider-group">
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={minTmdb}
              onChange={(e) => setMinTmdb(parseFloat(e.target.value))}
            />
            <span>{minTmdb.toFixed(1)}</span>
          </div>
        </label>
      </div>
      <div className="filter-group">
        <label>
          Min Rotten Tomatoes
          <div className="slider-group">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={minRotten}
              onChange={(e) => setMinRotten(parseInt(e.target.value, 10))}
            />
            <span>{minRotten}</span>
          </div>
        </label>
      </div>
      <sl-button
        variant="primary"
        type="button"
        disabled={loadingMeta}
        onClick={apply}
      >
        Search
      </sl-button>
    </aside>
  );
}
