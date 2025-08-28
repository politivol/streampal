import React from 'react';

export default function ReleaseDateSelector({ releaseDate, onChange }) {
  return (
    <div className="filter-group">
      <label>
        Release Date
        <select value={releaseDate} onChange={(e) => onChange(e.target.value)}>
          <option value="any">Any time</option>
          <option value="past_year">Past year</option>
          <option value="older">Older than 1 year</option>
        </select>
      </label>
    </div>
  );
}
