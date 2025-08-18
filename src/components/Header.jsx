export default function Header() {
  return (
    <header>
      <div className="header-bar">
        <a href="/" className="header-brand">
          <img src="/logo.svg" alt="StreamPal logo" className="header-logo" />
          <span className="header-title">StreamPal</span>
        </a>
        <nav className="header-nav">
          <ul className="header-list">
            <li><a href="#">Home</a></li>
            <li><a href="#">Seen</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
