import { useEffect, useState } from 'react';
import AuthPanel from './components/AuthPanel.jsx';
import SeenList from './components/SeenList.jsx';
import Header from './components/Header.jsx';
import FilterPanel from './components/FilterPanel.jsx';
import ResultsList from './components/ResultsList.jsx';
import SeriesPanel from './components/SeriesPanel.jsx';
import { fetchTrending, fetchDetails } from './lib/api.js';
import { supabase } from './lib/supabaseClient.js';

function App() {
  const [session, setSession] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    mediaType: 'movie',
    genres: [],
    releaseDate: 'any',
    providers: [],
    seriesOnly: false,
    minTmdb: '',
    minRotten: '',
  });
  const [results, setResults] = useState([]);
  const [pinnedIds, setPinnedIds] = useState(new Set());
  const [series, setSeries] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadResults = async (mediaType) => {
    const data = await fetchTrending(mediaType);
    const filtered = data.filter((r) => !pinnedIds.has(r.id));
    const detailed = await Promise.all(
      filtered.map((r) => fetchDetails(r.id).catch(() => null))
    );
    setResults((prev) => {
      const pinned = prev.filter((r) => pinnedIds.has(r.id));
      return [...pinned, ...detailed.filter(Boolean)];
    });
  };

  const applyFilters = async (f) => {
    setFilters(f);
    setShowFilters(false);
    await loadResults(f.mediaType || 'movie');
  };

  const rollAgain = async () => {
    await loadResults(filters.mediaType || 'movie');
  };

  const markSeen = (id) => {
    setResults((rs) => rs.filter((r) => r.id !== id));
    setPinnedIds((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  };

  const togglePin = (id) => {
    setPinnedIds((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="container">
      <Header session={session} onSession={setSession} onOpenFilters={() => setShowFilters(true)} />
      {showFilters && (
        <FilterPanel
          filters={filters}
          onApply={applyFilters}
          onClose={() => setShowFilters(false)}
        />
      )}
      {results.length > 0 && (
        <ResultsList
          results={results}
          pinnedIds={pinnedIds}
          onSeen={markSeen}
          onPin={togglePin}
          onRollAgain={rollAgain}
          onShowSeries={(s) => setSeries(s)}
        />
      )}
      {series && <SeriesPanel series={series} onClose={() => setSeries(null)} />}
      {session ? (
        <SeenList session={session} onSession={setSession} />
      ) : (
        <AuthPanel onSession={setSession} />
      )}
    </div>
  );
}

export default App;
