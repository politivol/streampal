import { useEffect, useState, useRef } from 'react';
import SeenList from './components/SeenList.jsx';
import Header from './components/Header.jsx';
import FilterPanel from './components/FilterPanel.jsx';
import ResultsList from './components/ResultsList.jsx';
import SeriesPanel from './components/SeriesPanel.jsx';
import AuthPanel from './components/AuthPanel.jsx';
import { fetchTrending, fetchDetails, searchTitles, discoverTitles } from './lib/api.js';
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
    notStreaming: false,
    isGeneralSearch: true,
  });
  const [results, setResults] = useState([]);
  const [pinnedIds, setPinnedIds] = useState(new Set());
  const [seenIds, setSeenIds] = useState(new Set());
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultsTitle, setResultsTitle] = useState('Trending');
  const seenLoaded = useRef(false);

  const startLoading = () => setLoading(true);
  const stopLoading = () => setLoading(false);

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

  useEffect(() => {
    const fetchSeenIds = async () => {
      if (session) {
        const { data } = await supabase
          .from('user_items')
          .select('tmdb_id')
          .eq('user_id', session.user.id)
          .eq('list', 'seen');
        setSeenIds(new Set(data?.map((i) => i.tmdb_id)));
      } else {
        const seen = JSON.parse(sessionStorage.getItem('seen') || '[]');
        setSeenIds(new Set(seen.map((i) => i.id)));
      }
    };

    seenLoaded.current = false;
    fetchSeenIds();
  }, [session]);

  const loadResults = async (f = filters) => {
    const isGeneral =
      typeof f.isGeneralSearch === 'boolean'
        ? f.isGeneralSearch
        : (!f.genres?.length &&
          (!f.releaseDate || f.releaseDate === 'any') &&
          !f.providers?.length &&
          !f.seriesOnly &&
          !f.minTmdb &&
          !f.minRotten &&
          !f.notStreaming);

    let data;
    let resultsTitle = 'Trending';

    // If it's a general search (no filters applied), fetch diverse content
    if (isGeneral) {
      // Fetch a mix of trending content from different time periods for variety
      const [weeklyTrending, dailyTrending] = await Promise.all([
        fetchTrending(f.mediaType || 'movie', 'week'),
        fetchTrending(f.mediaType || 'movie', 'day')
      ]);

      // Combine and shuffle for variety
      const combined = [...weeklyTrending, ...dailyTrending];
      const uniqueById = combined.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});
      data = Object.values(uniqueById);

      // Shuffle the array for random order
      for (let i = data.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [data[i], data[j]] = [data[j], data[i]];
      }

      resultsTitle = `Random ${f.mediaType === 'tv' ? 'TV Shows' : 'Movies'}`;
    } else {
      // Use TMDB discover endpoint when filters are applied
      data = await discoverTitles(f);
      resultsTitle = `Filtered ${f.mediaType === 'tv' ? 'TV Shows' : 'Movies'}`;
    }
    
    const filtered = data.filter(
      (r) => !pinnedIds.has(r.id) && !seenIds.has(r.id)
    );
    const detailed = (
      await Promise.all(filtered.map((r) => fetchDetails(r.id).catch(() => null)))
    ).filter(Boolean);
    
    const applied = detailed.filter((r) => {
      // Skip filtering if it's a general search
      if (isGeneral) return true;

      if (f.genres.length && !f.genres.every((g) => r.genres?.includes(g))) return false;
      if (f.releaseDate !== 'any' && r.releaseDate) {
        const year = new Date(r.releaseDate).getFullYear();
        const current = new Date().getFullYear();
        const diff = current - year;
        if (f.releaseDate === 'past_year' && diff > 1) return false;
        if (f.releaseDate === 'older' && diff <= 1) return false;
      }
      if (!f.notStreaming && f.providers.length && !f.providers.some((p) => r.streaming?.includes(p))) return false;
      if (f.notStreaming) {
        if (r.streaming?.length) return false;
      } else {
        if (!r.streaming?.length) return false;
      }
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
    setResultsTitle(resultsTitle);
  };

  useEffect(() => {
    if (seenLoaded.current) return;
    seenLoaded.current = true;
    startLoading();
    loadResults(filters).finally(stopLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seenIds]);

  const applyFilters = async (f) => {
    setFilters(f);
    setShowFilters(false);
    startLoading();
    try {
      await loadResults(f);
    } finally {
      stopLoading();
    }
  };

  const resetFilters = async () => {
    const defaults = {
      mediaType: 'movie',
      genres: [],
      releaseDate: 'any',
      providers: [],
      seriesOnly: false,
      minTmdb: 0,
      minRotten: 0,
      notStreaming: false,
      isGeneralSearch: true,
    };
    setFilters(defaults);
    setShowFilters(false);
    startLoading();
    try {
      await loadResults(defaults);
    } finally {
      stopLoading();
    }
  };

  const rollAgain = async () => {
    startLoading();
    try {
      await loadResults(filters);
    } finally {
      stopLoading();
    }
  };

  const handleSearch = async (q) => {
    startLoading();
    try {
      const data = await searchTitles(q, filters.mediaType || 'movie');
      const filtered = data.filter((r) => !pinnedIds.has(r.id));
      const detailed = (
        await Promise.all(filtered.map((r) => fetchDetails(r.id).catch(() => null)))
      ).filter(Boolean);
      setResults(detailed);
      setResultsTitle(`Search results for "${q}"`);
    } finally {
      stopLoading();
    }
  };

  const handleSeen = (id) => {
    setResults((rs) => rs.filter((r) => r.id !== id));
    setPinnedIds((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
    setSeenIds((set) => {
      const next = new Set(set);
      next.add(id);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <div className="container">
      <Header
        session={session}
        onOpenFilters={() => setShowFilters(true)}
        onOpenSeen={() => setShowSeen(true)}
        onLogin={() => setShowAuth(true)}
        onLogout={handleLogout}
        onSearch={handleSearch}
      />
      {showFilters && (
        <FilterPanel
          filters={filters}
          onApply={applyFilters}
          onClose={() => setShowFilters(false)}
          onReset={resetFilters}
        />
      )}
      {loading && (
        <div className="panel">
          <div className="loading-spinner">
            <sl-spinner></sl-spinner>
          </div>
          <ul className="results-list">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i}>
                <sl-card class="movie-card">
                  <sl-skeleton effect="pulse" style={{ height: '300px' }}></sl-skeleton>
                </sl-card>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!loading && results.length > 0 && (
        <ResultsList
          results={results}
          title={resultsTitle}
          session={session}
          pinnedIds={pinnedIds}
          onSeen={handleSeen}
          onPin={togglePin}
          onRollAgain={rollAgain}
          onShowSeries={(s) => setSeries(s)}
        />
      )}
      {!loading && results.length === 0 && (
        <div className="panel">
          <p>No results found. Try adjusting your filters.</p>
        </div>
      )}
      {series && <SeriesPanel series={series} onClose={() => setSeries(null)} />}
      {showSeen && (
        <SeenList
          session={session}
          onClose={() => setShowSeen(false)}
        />
      )}
      {showAuth && (
        <AuthPanel
          onSession={(s) => {
            setSession(s);
            setShowAuth(false);
          }}
          onClose={() => setShowAuth(false)}
        />
      )}
    </div>
  );
}

export default App;
