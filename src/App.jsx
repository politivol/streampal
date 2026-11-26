import { Suspense } from 'react';
import Header from './components/Header.jsx';
import ResultsList from './components/ResultsList.jsx';
import DevStatus from './components/DevStatus.jsx';
import {
  LazyAuthPanel,
  LazyFilterPanel,
  LazySeenList,
  LazySeriesPanel,
} from './lib/lazyComponents.js';
import { useAppState } from './hooks/useAppState.js';

const ComponentSpinner = () => (
  <div className="panel">
    <div className="loading-spinner">
      <sl-spinner></sl-spinner>
    </div>
  </div>
);

function App() {
  const {
    session,
    showFilters,
    showSeen,
    showAuth,
    filters,
    results,
    pinnedIds,
    series,
    loading,
    error,
    resultsTitle,
    setSession,
    setShowFilters,
    setShowSeen,
    setShowAuth,
    setSeries,
    applyFilters,
    resetFilters,
    rollAgain,
    handleSearch,
    handleSeen,
    togglePin,
    handleLogout,
  } = useAppState();

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
      <Suspense fallback={<ComponentSpinner />}>
        {showFilters && (
          <LazyFilterPanel
            filters={filters}
            onApply={applyFilters}
            onClose={() => setShowFilters(false)}
            onReset={resetFilters}
          />
        )}
      </Suspense>
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
      {!loading && error && (
        <div className="panel">
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && results.length > 0 && (
        <ResultsList
          results={results}
          title={resultsTitle}
          session={session}
          pinnedIds={pinnedIds}
          onSeen={handleSeen}
          onPin={togglePin}
          onRollAgain={rollAgain}
          onShowSeries={(next) => setSeries(next)}
        />
      )}
      {!loading && !error && results.length === 0 && (
        <div className="panel">
          <p>No results found. Try adjusting your filters.</p>
        </div>
      )}
      <Suspense fallback={<ComponentSpinner />}>
        {series && <LazySeriesPanel series={series} onClose={() => setSeries(null)} />}
      </Suspense>
      <Suspense fallback={<ComponentSpinner />}>
        {showSeen && <LazySeenList session={session} onClose={() => setShowSeen(false)} />}
      </Suspense>
      <Suspense fallback={<ComponentSpinner />}>
        {showAuth && (
          <LazyAuthPanel
            onSession={(next) => {
              if (next) {
                setSession(next);
                setShowAuth(false);
              }
            }}
            onClose={() => setShowAuth(false)}
          />
        )}
      </Suspense>
      <DevStatus />
    </div>
  );
}

export default App;
