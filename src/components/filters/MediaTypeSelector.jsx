export default function MediaTypeSelector({ mediaType, onMediaTypeChange }) {
  return (
    <div className="filter-group">
      <label>
        Media Type
        <select
          value={mediaType}
          onChange={(e) => onMediaTypeChange(e.target.value)}
        >
          <option value="all">All</option>
          <option value="movie">Movies</option>
          <option value="tv">TV Shows</option>
        </select>
      </label>
    </div>
  );
}
