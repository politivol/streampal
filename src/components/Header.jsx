import Search from './Search.jsx';

export default function Header({ session, onOpenFilters, onOpenSeen }) {
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
          onClick={onOpenFilters}
        >
          Filter
        </button>
        <div className="header-actions">
          <span className="auth-status">
            {session ? 'Logged in!' : 'Log in / Create account'}
          </span>
          <button className="btn secondary" type="button" onClick={onOpenSeen}>
            Seen
          </button>
        </div>
      </div>
    </header>
  );
}
