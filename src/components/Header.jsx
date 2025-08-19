import { useEffect, useRef, useState } from 'react';
import Search from './Search.jsx';

export default function Header({
  session,
  onOpenFilters,
  onOpenSeen,
  onLogin,
  onLogout,
  onSearch,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <header>
      <div className="header-bar">
        <a
          href="#"
          className="header-brand"
          onClick={(e) => {
            e.preventDefault();
            window.location.reload();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 160"
            role="img"
            aria-label="StreamPal logo"
            style={{ color: '#1E6CFB', height: '64px' }}
            className="header-logo"
          >
            <title>StreamPal Logo</title>
            <style>
              {`text{font-family:'Montserrat','Poppins',system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans','Liberation Sans',sans-serif}`}
            </style>
            <g
              transform="translate(8,8)"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="0" y="16" width="120" height="90" rx="18" ry="18" />
              <path d="M50 8 L60 16 M70 8 L60 16" />
              <path d="M14 118 L28 104 M106 118 L92 104" />
              <path d="M8 63 C 32 42, 56 52, 64 60 C 72 68, 96 84, 120 63" />
            </g>
            <text
              x="160"
              y="100"
              fill="currentColor"
              fontSize="72"
              fontWeight="700"
              letterSpacing="0.5"
            >
              Stream<tspan fontWeight="700">Pal</tspan>
            </text>
          </svg>
        </a>
        <div className="header-search">
          <Search onSearch={onSearch} />
        </div>
        <div className="header-menu" ref={menuRef}>
          <button
            className="menu-button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            Menu
          </button>
          {menuOpen && (
            <ul className="menu-dropdown" role="menu">
              {session ? (
                <li role="menuitem">
                  <sl-button
                    variant="neutral"
                    type="button"
                    style={{ width: '100%' }}
                    onClick={() => {
                      onLogout();
                      setMenuOpen(false);
                    }}
                  >
                    Logout
                  </sl-button>
                </li>
              ) : (
                <li role="menuitem">
                  <sl-button
                    variant="neutral"
                    type="button"
                    style={{ width: '100%' }}
                    onClick={() => {
                      onLogin();
                      setMenuOpen(false);
                    }}
                  >
                    Login
                  </sl-button>
                </li>
              )}
              <li role="menuitem">
                <sl-button
                  variant="neutral"
                  type="button"
                  style={{ width: '100%' }}
                  onClick={() => {
                    onOpenSeen();
                    setMenuOpen(false);
                  }}
                >
                  Seen List
                </sl-button>
              </li>
              <li role="menuitem">
                <sl-button
                  variant="neutral"
                  type="button"
                  style={{ width: '100%' }}
                  onClick={() => {
                    onOpenFilters();
                    setMenuOpen(false);
                  }}
                >
                  Filter
                </sl-button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}

