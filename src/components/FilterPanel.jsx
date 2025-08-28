import React from 'react';
import { useFilterState } from '../hooks/useFilterState.js';
import MediaTypeSelector from './filters/MediaTypeSelector.jsx';
import GenreSelector from './filters/GenreSelector.jsx';
import ProviderSelector from './filters/ProviderSelector.jsx';
import ReleaseDateSelector from './filters/ReleaseDateSelector.jsx';
import RatingFilters from './filters/RatingFilters.jsx';
import OtherFilters from './filters/OtherFilters.jsx';

export default function FilterPanel({ filters = {}, onApply, onClose, onReset }) {
  const {
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
    removeGenre,
    removeProvider,
    getCurrentFilters,
    resetFilters,
  } = useFilterState(filters);

  const handleGenreToggle = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleProviderToggle = (provider) => {
    setProviders(prev =>
      prev.includes(provider)
        ? prev.filter(p => p !== provider)
        : [...prev, provider]
    );
  };

  const handleApply = () => {
    onApply?.(getCurrentFilters());
  };

  const handleReset = () => {
    resetFilters();
    onReset?.();
  };

  return (
    <aside className="filter-panel open">
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
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
          </select>
        </label>
      </div>

      <GenreSelector
        genreOptions={genreOptions}
        selectedGenres={selectedGenres}
        genreSearch={genreSearch}
        onGenreSearchChange={setGenreSearch}
        onGenreToggle={handleGenreToggle}
        onGenreRemove={removeGenre}
        loading={loadingMeta}
      />

      <ProviderSelector
        providerOptions={providerOptions}
        providers={providers}
        providerSearch={providerSearch}
        onProviderSearchChange={setProviderSearch}
        onProviderToggle={handleProviderToggle}
        onProviderRemove={removeProvider}
        loading={loadingMeta}
      />

      <ReleaseDateSelector
        releaseDate={releaseDate}
        onChange={setReleaseDate}
      />

      <RatingFilters
        minTmdb={minTmdb}
        minRotten={minRotten}
        onMinTmdbChange={setMinTmdb}
        onMinRottenChange={setMinRotten}
      />

      <OtherFilters
        seriesOnly={seriesOnly}
        notStreaming={notStreaming}
        onSeriesOnlyChange={setSeriesOnly}
        onNotStreamingChange={setNotStreaming}
      />

      <div className="row row--actions">
        <sl-button variant="neutral" type="button" onClick={handleReset}>
          Reset Filters
        </sl-button>
        <sl-button
          variant="primary"
          type="button"
          onClick={handleApply}
        >
          Apply Filters
        </sl-button>
      </div>
    </aside>
  );
}
