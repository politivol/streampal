import { useEffect, useState } from 'react';
import SeenList from './components/SeenList.jsx';
import Header from './components/Header.jsx';
import FilterPanel from './components/FilterPanel.jsx';
import ResultsList from './components/ResultsList.jsx';
import SeriesPanel from './components/SeriesPanel.jsx';
import AuthPanel from './components/AuthPanel.jsx';
import { fetchTrending, fetchDetails } from './lib/api.js';
import { supabase } from './lib/supabaseClient.js';

function App() {
  const [session, setSession] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSeen, setShowSeen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) setShowAuth(false);
  }, [session]);

  const loadResults = async (f = filters) => {
    const data = await fetchTrending(f.mediaType || 'movie');
    const filtered = data.filter((r) => !pinnedIds.has(r.id));
    const detailed = (
      await Promise.all(filtered.map((r) => fetchDetails(r.id).catch(() => null)))
    ).filter(Boolean);
    const applied = detailed.filter((r) => {
      if (f.genres.length && !f.genres.every((g) => r.genres?.includes(g))) return false;
      if (f.releaseDate !== 'any' && r.releaseDate) {
        const year = new Date(r.releaseDate).getFullYear();
        const current = new Date().getFullYear();
        const diff = current - year;
        if (f.releaseDate === 'past_year' && diff > 1) return false;
        if (f.releaseDate === 'older' && diff <= 1) return false;
      }
      if (f.providers.length && !f.providers.some((p) => r.streaming?.includes(p))) return false;
      if (f.seriesOnly && !r.series) return false;
      if (f.minTmdb && (r.ratings.tmdb ?? 0) < parseFloat(f.minTmdb)) return false;
      if (
        f.minRotten &&
        (r.ratings.rottenTomatoes ?? 0) < parseInt(f.minRotten, 10)
      )
        return false;
      return true;
    });
    setResults((prev) => {
      const pinned = prev.filter((r) => pinnedIds.has(r.id));
      return [...pinned, ...applied];
    });
  };

  useEffect(() => {
    loadResults(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = async (f) => {
    setFilters(f);
    setShowFilters(false);
    await loadResults(f);
  };

  const rollAgain = async () => {
    await loadResults(filters);
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
      <Header
        session={session}
        onOpenFilters={() => setShowFilters(true)}
        onOpenSeen={() => setShowSeen(true)}
        onLogin={() => setShowAuth(true)}
      />
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
          session={session}
          pinnedIds={pinnedIds}
          onSeen={markSeen}
          onPin={togglePin}
          onRollAgain={rollAgain}
          onShowSeries={(s) => setSeries(s)}
        />
      )}
      {series && <SeriesPanel series={series} onClose={() => setSeries(null)} />}
      {showSeen && (
        <SeenList
          session={session}
          onSession={setSession}
          onClose={() => setShowSeen(false)}
        />
      )}
      {showAuth && (
        <AuthPanel
          onSession={(s) => {
            setSession(s);
            setShowAuth(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
