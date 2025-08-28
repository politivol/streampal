import React from 'react';

export default function RatingFilters({
  minTmdb,
  minRotten,
  onMinTmdbChange,
  onMinRottenChange
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
          Min Rotten Tomatoes
          <div className="slider-group">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={minRotten}
              onChange={(e) => onMinRottenChange(parseInt(e.target.value, 10))}
            />
            <span>{minRotten}</span>
          </div>
        </label>
      </div>
    </>
  );
}
