import { useEffect, useState, Suspense } from 'react';
import SeenList from './components/SeenList.jsx';
import Header from './components/Header.jsx';
import FilterPanel from './components/FilterPanel.jsx';
import ResultsList from './components/ResultsList.jsx';
import SeriesPanel from './components/SeriesPanel.jsx';
import AuthPanel from './components/AuthPanel.jsx';
import DevStatus from './components/DevStatus.jsx';
import { useAppState } from './hooks/useAppState.js';

// Lazy load heavier components
const LazyResultsList = ResultsList;
const LazySeriesPanel = SeriesPanel;
const LazyAuthPanel = AuthPanel;
const LazySeenList = SeenList;

// Loading component for lazy-loaded components
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
    seenIds,
    series,
    loading,
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
        <LazyResultsList
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
      <Suspense fallback={<ComponentSpinner />}>
        {series && <LazySeriesPanel series={series} onClose={() => setSeries(null)} />}
      </Suspense>
      <Suspense fallback={<ComponentSpinner />}>
        {showSeen && (
          <LazySeenList
            session={session}
            onClose={() => setShowSeen(false)}
          />
        )}
      </Suspense>
      <Suspense fallback={<ComponentSpinner />}>
        {showAuth && (
          <LazyAuthPanel
            onSession={(s) => {
              setSession(s);
              setShowAuth(false);
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
