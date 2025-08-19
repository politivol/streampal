import { useEffect, useState } from 'react';

export default function Search({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const fetchResults = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_OMDB_PROXY_URL}?s=${encodeURIComponent(query)}&type=movie`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setResults(data.Search || []);
      } catch (_) {
        // ignore
      }
    };
    const id = setTimeout(fetchResults, 300);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query]);

  const handleSelect = (item) => {
    onSelect?.(item);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="search">
      <input
        type="text"
        placeholder="Search movies..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((r) => (
            <li key={r.imdbID}>
              <sl-button variant="neutral" type="button" onClick={() => handleSelect(r)}>
                {r.Title} ({r.Year})
              </sl-button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

