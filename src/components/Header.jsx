import { useState } from 'react';
import Search from './Search.jsx';

export default function Header({ session, onSession }) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <header>
      <div className="header-bar">
        <a href="/" className="header-brand">
          <img src="/logo.svg" alt="StreamPal logo" className="header-logo" />
          <span className="header-title">StreamPal</span>
        </a>
        <div className="header-search">
          <Search />
        </div>
        <button
          className="btn secondary"
          type="button"
          onClick={() => setShowFilters(true)}
        >
          Filter
        </button>
        <div className="header-actions">
          <span className="auth-status">
            {session ? 'Logged in!' : 'Log in / Create account'}
          </span>
          <button className="btn secondary" type="button">
            Seen
          </button>
        </div>
      </div>
      {showFilters && (
        <aside className="filter-panel">
          <div className="row row--actions">
            <h3>Filters</h3>
            <button
              className="btn secondary"
              type="button"
              onClick={() => setShowFilters(false)}
            >
              Close
            </button>
          </div>
          <p>Filter options go here.</p>
        </aside>
      )}
    </header>
  );
}
