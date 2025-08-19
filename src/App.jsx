import { useEffect, useState } from 'react';
import AuthPanel from './components/AuthPanel.jsx';
import SeenList from './components/SeenList.jsx';
import Header from './components/Header.jsx';
import FilterPanel from './components/FilterPanel.jsx';
import { fetchTrending } from './lib/api.js';
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
  const [index, setIndex] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const applyFilters = async (f) => {
    setFilters(f);
    setShowFilters(false);
    const data = await fetchTrending(f.mediaType || 'movie');
    setResults(data);
    setIndex(0);
  };

  const rollAgain = () => {
    if (results.length > 0) {
      setIndex((i) => (i + 1) % results.length);
    }
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
        <div className="panel">
          <div className="row row--actions">
            <h2>Results</h2>
            <button className="btn secondary" type="button" onClick={rollAgain}>
              Roll Again
            </button>
          </div>
          <div className="result-item">
            <h3>{results[index].title}</h3>
            {results[index].artwork && (
              <img src={results[index].artwork} alt={results[index].title} />
            )}
          </div>
        </div>
      )}
      {session ? (
        <SeenList session={session} onSession={setSession} />
      ) : (
        <AuthPanel onSession={setSession} />
      )}
    </div>
  );
}

export default App;
