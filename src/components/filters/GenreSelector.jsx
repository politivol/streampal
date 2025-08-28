import { useMemo } from 'react';

import React from 'react';

export default function GenreSelector({
  genreOptions,
  selectedGenres,
  genreSearch,
  onGenreSearchChange,
  onGenreToggle,
  onGenreRemove,
  loading
}) {
  const filteredGenres = useMemo(() => {
    if (!genreSearch) return genreOptions;
    return genreOptions.filter(g =>
      g.toLowerCase().includes(genreSearch.toLowerCase())
    );
  }, [genreOptions, genreSearch]);

  if (loading) {
    return (
      <div className="filter-group">
        <label>
          Genres
          <div className="loading-spinner">
            <sl-spinner></sl-spinner>
          </div>
        </label>
      </div>
    );
  }

  return (
    <div className="filter-group">
      <label>
        Genres
        <div className="multi-select">
          <input
            type="text"
            placeholder="Search genres"
            value={genreSearch}
            onChange={(e) => onGenreSearchChange(e.target.value)}
          />
          <div className="selected-tags">
            {selectedGenres.map(genre => (
              <sl-tag
                key={genre}
                size="small"
                removable
                onSlRemove={() => onGenreRemove(genre)}
              >
                {genre}
              </sl-tag>
            ))}
          </div>
          <div className="options">
            {filteredGenres.map(genre => (
              <label key={genre}>
                <input
                  type="checkbox"
                  checked={selectedGenres.includes(genre)}
                  onChange={() => onGenreToggle(genre)}
                />
                {genre}
              </label>
            ))}
          </div>
        </div>
      </label>
    </div>
  );
}
