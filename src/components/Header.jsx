import Search from './Search.jsx';

export default function Header({ session, onOpenFilters, onOpenSeen, onLogin, onLogout }) {
  return (
    <header>
      <div className="header-bar">
        <a href="/" className="header-brand">
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
          <Search />
        </div>
        <sl-dropdown class="header-menu">
          <sl-button slot="trigger" caret>Menu</sl-button>
          <sl-menu>
            {session ? (
              <sl-menu-item onClick={onLogout}>Logout</sl-menu-item>
            ) : (
              <sl-menu-item onClick={onLogin}>Login</sl-menu-item>
            )}
            <sl-menu-item onClick={onOpenSeen}>Seen List</sl-menu-item>
            <sl-menu-item onClick={onOpenFilters}>Filter</sl-menu-item>
          </sl-menu>
        </sl-dropdown>
      </div>
    </header>
  );
}

