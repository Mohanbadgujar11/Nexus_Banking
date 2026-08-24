import { useState, useRef, useEffect } from 'react';

function Header({ user, currentView, onNavigate, onOpenLogin, onOpenRegister, onLogout }) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const headerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleNavClick = (viewName) => {
    setOpenDropdown(null);
    onNavigate(viewName);
  };

  const toggleDropdown = (menuName) => {
    setOpenDropdown(openDropdown === menuName ? null : menuName);
  };

  const isAdmin = user?.role === 'ROLE_ADMIN';

  return (
    <header className="sticky-header" ref={headerRef}>
      <div className="header-inner">
        {/* Brand / Logo */}
        <div className="header-brand" onClick={() => handleNavClick('dashboard')}>
          <div className="brand-icon-box">
            <span className="brand-dot"></span>
            <span className="brand-initial">N</span>
          </div>
          <div className="brand-text-group">
            <span className="brand-title">NEXUS</span>
            <span className="brand-subtitle">PRIVATE RESERVE</span>
          </div>
        </div>

        {/* Desktop Navigation with Hover & Click Persistent Dropdowns */}
        <nav className="header-nav">
          {/* Dashboard Home Button */}
          <button
            type="button"
            className={`nav-link ${currentView === 'dashboard' ? 'active-nav' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            Dashboard
          </button>

          {/* If Admin, show Admin Console button */}
          {isAdmin && (
            <button
              type="button"
              className={`nav-link admin-nav-btn ${currentView === 'admin' ? 'active-nav' : ''}`}
              onClick={() => handleNavClick('admin')}
            >
              🛡 Admin Console
            </button>
          )}

          {/* Accounts & Cards Dropdown */}
          <div
            className={`nav-item has-dropdown ${openDropdown === 'accounts' ? 'is-open' : ''} ${['accounts', 'cards'].includes(currentView) ? 'active-parent' : ''}`}
            onMouseEnter={() => setOpenDropdown('accounts')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              className="nav-link"
              type="button"
              onClick={() => toggleDropdown('accounts')}
            >
              <span>Accounts & Cards</span>
              <span className="chevron-icon">▾</span>
            </button>
            <div className="dropdown-menu">
              <div className="dropdown-grid">
                <button
                  type="button"
                  className="dropdown-item-btn"
                  onClick={() => handleNavClick('accounts')}
                >
                  <div className="item-icon">🏛</div>
                  <div className="item-content">
                    <span className="item-title">Accounts & Treasury</span>
                    <span className="item-desc">Checking, routing numbers, and certified statement exports.</span>
                  </div>
                </button>
                <button
                  type="button"
                  className="dropdown-item-btn"
                  onClick={() => handleNavClick('cards')}
                >
                  <div className="item-icon">💎</div>
                  <div className="item-content">
                    <span className="item-title">Titanium & Virtual Cards</span>
                    <span className="item-desc">3D interactive card studio, freeze locks, and virtual issuance.</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Transfers Dropdown */}
          <div
            className={`nav-item has-dropdown ${openDropdown === 'transfers' ? 'is-open' : ''} ${currentView === 'transfers' ? 'active-parent' : ''}`}
            onMouseEnter={() => setOpenDropdown('transfers')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              className="nav-link"
              type="button"
              onClick={() => handleNavClick('transfers')}
            >
              <span>Transfers</span>
              <span className="chevron-icon">▾</span>
            </button>
            <div className="dropdown-menu">
              <div className="dropdown-grid">
                <button
                  type="button"
                  className="dropdown-item-btn"
                  onClick={() => handleNavClick('transfers')}
                >
                  <div className="item-icon">⚡</div>
                  <div className="item-content">
                    <span className="item-title">Instant P2P & Wire Hub</span>
                    <span className="item-desc">Zero-latency internal transfers and global SWIFT/SEPA wires.</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Wealth & Yield Dropdown */}
          <div
            className={`nav-item has-dropdown ${openDropdown === 'vault' ? 'is-open' : ''} ${currentView === 'vault' ? 'active-parent' : ''}`}
            onMouseEnter={() => setOpenDropdown('vault')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              className="nav-link"
              type="button"
              onClick={() => handleNavClick('vault')}
            >
              <span>Wealth & Vault</span>
              <span className="chevron-icon">▾</span>
            </button>
            <div className="dropdown-menu">
              <div className="dropdown-grid">
                <button
                  type="button"
                  className="dropdown-item-btn"
                  onClick={() => handleNavClick('vault')}
                >
                  <div className="item-icon">📈</div>
                  <div className="item-content">
                    <span className="item-title">4.85% APY High-Yield Vault</span>
                    <span className="item-desc">Compound interest wealth simulator and goal-based pots.</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Security & Audit Dropdown */}
          <div
            className={`nav-item has-dropdown ${openDropdown === 'security' ? 'is-open' : ''} ${currentView === 'security' ? 'active-parent' : ''}`}
            onMouseEnter={() => setOpenDropdown('security')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              className="nav-link"
              type="button"
              onClick={() => handleNavClick('security')}
            >
              <span>Security</span>
              <span className="chevron-icon">▾</span>
            </button>
            <div className="dropdown-menu">
              <div className="dropdown-grid">
                <button
                  type="button"
                  className="dropdown-item-btn"
                  onClick={() => handleNavClick('security')}
                >
                  <div className="item-icon">🔒</div>
                  <div className="item-content">
                    <span className="item-title">Security & Audit Ledger</span>
                    <span className="item-desc">BCrypt telemetry, active sessions, and double-entry proof.</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Analytics Dropdown */}
          <div
            className={`nav-item has-dropdown ${openDropdown === 'analytics' ? 'is-open' : ''} ${currentView === 'analytics' ? 'active-parent' : ''}`}
            onMouseEnter={() => setOpenDropdown('analytics')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              className="nav-link"
              type="button"
              onClick={() => handleNavClick('analytics')}
            >
              <span>Analytics</span>
              <span className="chevron-icon">▾</span>
            </button>
            <div className="dropdown-menu">
              <div className="dropdown-grid">
                <button
                  type="button"
                  className="dropdown-item-btn"
                  onClick={() => handleNavClick('analytics')}
                >
                  <div className="item-icon">📊</div>
                  <div className="item-content">
                    <span className="item-title">Cash Flow Intelligence</span>
                    <span className="item-desc">Spending velocity, monthly inflow trends, and expense metrics.</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Right Actions / Auth Controls */}
        <div className="header-actions">
          {user ? (
            <div className="user-auth-panel">
              <div className="user-badge-pill">
                <span className="status-online-dot"></span>
                <span className="username-text">@{user.username}</span>
                <span className="verified-tag">
                  {isAdmin ? 'ADMIN' : 'MEMBER'}
                </span>
              </div>
              <button type="button" className="btn-header-secondary logout-btn-header" onClick={onLogout}>
                Sign Out
              </button>
            </div>
          ) : (
            <div className="guest-auth-panel">
              <button type="button" className="btn-header-secondary" onClick={onOpenLogin}>
                Sign In
              </button>
              <button type="button" className="btn-header-primary" onClick={onOpenRegister}>
                Open Account
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
