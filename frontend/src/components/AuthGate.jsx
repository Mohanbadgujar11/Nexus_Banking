import { useState } from 'react';
import Login from './Login.jsx';
import Register from './Register.jsx';

function AuthGate({ onAuthSuccess, initialMode = 'login' }) {
  const [authMode, setAuthMode] = useState(initialMode);
  const [prefilledIdentifier, setPrefilledIdentifier] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState('');

  const handleRegisterSuccess = (registeredUser) => {
    setPrefilledIdentifier(registeredUser?.username || registeredUser?.email || '');
    setRegSuccessMessage('Account created successfully! Please enter your master password to sign in.');
    setAuthMode('login');
  };

  return (
    <div className="auth-gate-wrapper">
      <div className="auth-gate-container">
        {/* Left Side: Institutional Trust & Brand Showcase */}
        <div className="auth-gate-hero">
          <div className="gate-brand-pill">
            <span className="gate-brand-dot"></span>
            <span>SECURE FINANCIAL ARCHITECTURE</span>
          </div>

          <h1 className="gate-hero-title">
            The Private Reserve for <span className="gold-gradient-text">Modern Capital</span>
          </h1>

          <p className="gate-hero-desc">
            Nexus Banking Core delivers institutional-grade double-entry ledger accuracy, high-precision reserve management, and instant card issuance guarded by cryptographic proof.
          </p>

          <div className="gate-features-list">
            <div className="gate-feature-item">
              <div className="gf-icon">🏛</div>
              <div>
                <h4>Double-Entry Atomic Ledger</h4>
                <p>Every transaction commits balanced debit and credit entries to the core banking ledger.</p>
              </div>
            </div>

            <div className="gate-feature-item">
              <div className="gf-icon">🔒</div>
              <div>
                <h4>Immediate Hardware Card Locks</h4>
                <p>Instantly freeze cards, adjust daily authorization limits, and issue disposable virtual cards.</p>
              </div>
            </div>

            <div className="gate-feature-item">
              <div className="gf-icon">📈</div>
              <div>
                <h4>4.85% APY Daily Wealth Vaults</h4>
                <p>Compounding high-yield savings pots with real-time interest projections.</p>
              </div>
            </div>
          </div>

          <div className="gate-trust-footer">
            <span className="trust-badge">🛡 SOC-2 TYPE II CERTIFIED</span>
            <span className="trust-badge">⚡ 256-BIT TLS ENCRYPTION</span>
            <span className="trust-badge">🏛 FDIC SWEEP PROTECTED</span>
          </div>
        </div>

        {/* Right Side: Auth Tabs & Form Card */}
        <div className="auth-gate-form-column">
          <div className="auth-mode-switch-tabs">
            <button
              type="button"
              className={`auth-mode-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setRegSuccessMessage('');
                setAuthMode('login');
              }}
            >
              Sign In to Account
            </button>
            <button
              type="button"
              className={`auth-mode-tab ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => {
                setRegSuccessMessage('');
                setAuthMode('register');
              }}
            >
              Open New Account
            </button>
          </div>

          <div className="gate-form-inner">
            {authMode === 'login' ? (
              <Login
                initialIdentifier={prefilledIdentifier}
                registrationMessage={regSuccessMessage}
                onNavigateToRegister={() => {
                  setRegSuccessMessage('');
                  setAuthMode('register');
                }}
                onLoginSuccess={onAuthSuccess}
              />
            ) : (
              <Register
                onNavigateToLogin={() => {
                  setRegSuccessMessage('');
                  setAuthMode('login');
                }}
                onRegisterSuccess={handleRegisterSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthGate;

