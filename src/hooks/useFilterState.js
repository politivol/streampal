import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  normalizeProviderName,
  US_STREAMING_PROVIDERS,
} from '../lib/providers.js';
import config from '../lib/config.js';

const TMDB_API_KEY = config.tmdbApiKey;

export function useFilterState(initialFilters = {}) {
  const [mediaType, setMediaType] = useState(initialFilters.mediaType || 'movie');
  const [genreOptions, setGenreOptions] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState(initialFilters.genres || []);
  const [genreSearch, setGenreSearch] = useState('');
  const [releaseDate, setReleaseDate] = useState(initialFilters.releaseDate || 'any');
  const [providerOptions, setProviderOptions] = useState([]);
  const [providers, setProviders] = useState(initialFilters.providers || []);
  const [providerSearch, setProviderSearch] = useState('');
  const [seriesOnly, setSeriesOnly] = useState(initialFilters.seriesOnly || false);
  const [minTmdb, setMinTmdb] = useState(Number(initialFilters.minTmdb) || 0);
  const [minRotten, setMinRotten] = useState(Number(initialFilters.minRotten) || 0);
  const [notStreaming, setNotStreaming] = useState(initialFilters.notStreaming || false);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Fetch metadata for genres and providers
  useEffect(() => {
    let active = true;
    const fetchMeta = async () => {
      // Check if TMDB API key is available
      if (!TMDB_API_KEY) {
        console.warn('TMDB API key not available - filter options will be limited');
        // Provide fallback genre and provider options
        setGenreOptions([
          'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
          'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
          'Romance', 'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'
        ]);
        setProviderOptions(US_STREAMING_PROVIDERS);
        setLoadingMeta(false);
        return;
      }

      try {
        const [movieGenresRes, tvGenresRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}`),
          fetch(`https://api.themoviedb.org/3/genre/tv/list?api_key=${TMDB_API_KEY}`),
        ]);
        if (!active) return;
        const movieGenres = await movieGenresRes.json();
        const tvGenres = await tvGenresRes.json();
        if (!active) return;
        const combined = [...(movieGenres.genres || []), ...(tvGenres.genres || [])];
        const names = Array.from(new Set(combined.map((g) => g.name))).sort((a, b) =>
          a.localeCompare(b)
        );
        if (active) setGenreOptions(names);

        const provRes = await fetch(
          `https://api.themoviedb.org/3/watch/providers/movie?api_key=${TMDB_API_KEY}&watch_region=US`
        );
        if (!active) return;
        const provData = await provRes.json();
        if (!active) return;
        const provNames = Array.from(
          new Set(
            (provData.results || [])
              .map((p) => normalizeProviderName(p.provider_name))
              .filter((p) => US_STREAMING_PROVIDERS.includes(p))
          )
        ).sort((a, b) => a.localeCompare(b));
        if (active) setProviderOptions(provNames);
      } catch (error) {
        console.warn('Failed to fetch filter metadata:', error);
        // Provide fallback options
        if (active) {
          setGenreOptions([
            'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
            'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
            'Romance', 'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'
          ]);
          setProviderOptions(US_STREAMING_PROVIDERS);
        }
      } finally {
        if (active) setLoadingMeta(false);
      }
    };
    fetchMeta();
    return () => {
      active = false;
    };
  }, []);

  const removeGenre = useCallback((g) => {
    setSelectedGenres((prev) => prev.filter((sg) => sg !== g));
  }, []);

  const removeProvider = useCallback((p) => {
    setProviders((prev) => prev.filter((sp) => sp !== p));
  }, []);

  const isGeneralSearch = useMemo(() =>
    selectedGenres.length === 0 &&
    providers.length === 0 &&
    releaseDate === 'any' &&
    !seriesOnly &&
    minTmdb === 0 &&
    minRotten === 0 &&
    !notStreaming,
    [selectedGenres.length, providers.length, releaseDate, seriesOnly, minTmdb, minRotten, notStreaming]
  );

  const getCurrentFilters = useCallback(() => ({
    mediaType,
    genres: selectedGenres,
    releaseDate,
    providers,
    seriesOnly,
    minTmdb,
    minRotten,
    notStreaming,
    isGeneralSearch,
  }), [mediaType, selectedGenres, releaseDate, providers, seriesOnly, minTmdb, minRotten, notStreaming, isGeneralSearch]);

  const resetFilters = useCallback(() => {
    setMediaType('movie');
    setSelectedGenres([]);
    setGenreSearch('');
    setReleaseDate('any');
    setProviders([]);
    setProviderSearch('');
    setSeriesOnly(false);
    setMinTmdb(0);
    setMinRotten(0);
    setNotStreaming(false);
  }, []);

  return {
    // State
    mediaType,
    genreOptions,
    selectedGenres,
    genreSearch,
    releaseDate,
    providerOptions,
    providers,
    providerSearch,
    seriesOnly,
    minTmdb,
    minRotten,
    notStreaming,
    loadingMeta,
    isGeneralSearch,

    // Setters
    setMediaType,
    setSelectedGenres,
    setGenreSearch,
    setReleaseDate,
    setProviders,
    setProviderSearch,
    setSeriesOnly,
    setMinTmdb,
    setMinRotten,
    setNotStreaming,

    // Actions
    removeGenre,
    removeProvider,
    getCurrentFilters,
    resetFilters,
  };
}
