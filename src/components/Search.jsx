import { useEffect, useState } from 'react';
import { searchTitles } from '../lib/api.js';

export default function Search({ onSearch, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const fetchResults = async () => {
      try {
        const data = await searchTitles(query, 'multi');
        setResults(data);
      } catch (_) {
        // ignore
      }
    };
    const id = setTimeout(fetchResults, 300);
    return () => {
      clearTimeout(id);
    };
  }, [query]);

  const handleSelect = (item) => {
    if (onSelect) {
      onSelect(item);
    } else {
      onSearch?.(item.title);
    }
    setQuery('');
    setResults([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      onSearch?.(query.trim());
      setQuery('');
      setResults([]);
    }
  };

  return (
    <div className="search">
      <input
        type="text"
        placeholder="Search movies..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((r) => (
            <li key={r.id} onClick={() => handleSelect(r)}>
              <sl-button variant="neutral" type="button">
                {r.title}
              </sl-button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
