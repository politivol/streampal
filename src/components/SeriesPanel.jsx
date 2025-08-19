import { useEffect, useState } from 'react';
import { fetchSeriesEntries } from '../lib/series.js';

export default function SeriesPanel({ series, onClose }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await fetchSeriesEntries(series);
        if (active) setEntries(data);
      } catch (e) {
        if (active) setEntries([]);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [series]);

  return (
    <div className="panel side-panel">
      <div className="row row--actions">
        <h2>{series?.name || 'Series'}</h2>
        <button className="btn secondary" type="button" onClick={onClose}>
          Close
        </button>
      </div>
      <ul>
        {entries.map((e) => (
          <li key={e.id || e.imdbID}>
            {e.title} {e.releaseDate ? `(${e.releaseDate})` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
