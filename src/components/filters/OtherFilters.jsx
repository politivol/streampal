import React from 'react';

export default function OtherFilters({
  seriesOnly,
  notStreaming,
  onSeriesOnlyChange,
  onNotStreamingChange
}) {
  return (
    <>
      <div className="filter-group">
        <label>
          <input
            type="checkbox"
            checked={notStreaming}
            onChange={(e) => onNotStreamingChange(e.target.checked)}
          />
          Not currently streaming
        </label>
      </div>
      <div className="filter-group">
        <label>
          <input
            type="checkbox"
            checked={seriesOnly}
            onChange={(e) => onSeriesOnlyChange(e.target.checked)}
          />
          Series only
        </label>
      </div>
    </>
  );
}
