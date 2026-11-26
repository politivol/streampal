import React from 'react';

export default function RatingFilters({
  minTmdb,
  minImdb,
  onMinTmdbChange,
  onMinImdbChange
}) {
  return (
    <>
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
              onChange={(e) => onMinTmdbChange(parseFloat(e.target.value))}
            />
            <span>{minTmdb.toFixed(1)}</span>
          </div>
        </label>
      </div>
      <div className="filter-group">
        <label>
          Min IMDb
          <div className="slider-group">
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={minImdb}
              onChange={(e) => onMinImdbChange(parseFloat(e.target.value))}
            />
            <span>{Number(minImdb).toFixed(1)}</span>
          </div>
        </label>
      </div>
    </>
  );
}
