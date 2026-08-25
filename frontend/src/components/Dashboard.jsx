import { useState, useEffect } from 'react';
import PinPromptModal from './PinPromptModal.jsx';

function Dashboard({ user, balance, transactions, onExecuteTransfer, onNavigate, onOpenLogin, onOpenRegister }) {
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [txFilter, setTxFilter] = useState('all'); // 'all' | 'credit' | 'debit'
  const [transferLoading, setTransferLoading] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isBalanceMasked, setIsBalanceMasked] = useState(false);

  useEffect(() => {
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem('nexus_user_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setIsBalanceMasked(!!parsed.maskBalanceOnDashboard);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadSettings();
    window.addEventListener('nexus_settings_changed', loadSettings);
    return () => window.removeEventListener('nexus_settings_changed', loadSettings);
  }, []);

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      if (onOpenLogin) onOpenLogin();
      return;
    }

    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      setTransferMessage('Please enter a valid transfer amount.');
      return;
    }
    if (amt > (parseFloat(balance) || 0)) {
      setTransferMessage('Insufficient available balance in your Nexus reserve account.');
      return;
    }

    if (!transferRecipient.trim()) {
      setTransferMessage('Please enter a beneficiary account number or username.');
      return;
    }

    setIsPinModalOpen(true);
  };

  const handlePinConfirm = async (pin) => {
    const amt = parseFloat(transferAmount);
    setTransferLoading(true);
    setTransferMessage('');

    try {
      const result = await onExecuteTransfer(
        amt,
        transferRecipient.trim(),
        `Instant Transfer to ${transferRecipient.trim()}`,
        pin
      );

      if (result?.success) {
        setTransferMessage(`Successfully executed $${amt.toFixed(2)} transfer to ${transferRecipient}!`);
        setTransferAmount('');
        setTransferRecipient('');
        setIsPinModalOpen(false);
        return { success: true };
      } else {
        return { error: result?.message || 'Transfer authorization failed.' };
      }
    } catch {
      return { error: 'Error connecting to transfer service.' };
    } finally {
      setTransferLoading(false);
      setTimeout(() => setTransferMessage(''), 5000);
    }
  };

  const filteredTransactions = (transactions || []).filter((tx) => {
    if (txFilter === 'credit') return tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_CREDIT' || tx.type === 'credit';
    if (txFilter === 'debit') return tx.type === 'TRANSFER_DEBIT' || tx.type === 'debit';
    return true;
  });

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Active Member';

  const userAccNumber = user?.accountNumber || 'NX-PENDING';
  const displayBalance = parseFloat(balance) || 0;

  return (
    <div className="view-container dashboard-main">
      {/* Luxury Welcome Hero Card */}
      <div className="lux-hero-banner">
        <div className="hero-content-left">
          <div className="hero-badge-row">
            <span className="hero-status-pill">
              <span className="live-dot"></span> Core Online • 24/7 RTGS
            </span>
            <span className="hero-tier-tag">
              {user?.role === 'ROLE_ADMIN' ? 'INSTITUTIONAL ADMIN' : 'PRIVATE RESERVE'}
            </span>
          </div>

          <h1 className="hero-heading">
            {user ? `Welcome back, ${user.fullName || user.username}` : 'Private Banking Engineered for Sovereign Capital'}
          </h1>
          <p className="hero-subtext">
            {user
              ? `Your unique account (${userAccNumber}) is active. Manage your private reserves, execute real-time transfers, and inspect verified transaction receipts.`
              : 'The next-generation core banking infrastructure designed for high-velocity capital, private reserves, and cryptographic security.'}
          </p>

          <div className="hero-cta-group">
            {/* If Admin, show Admin Dashboard button */}
            {user?.role === 'ROLE_ADMIN' && (
              <button type="button" className="lux-btn-primary admin-cta-btn" onClick={() => onNavigate('admin')}>
                ⚡ Open Admin Console & Deposit Funds
              </button>
            )}

            {!user && (
              <>
                <button type="button" className="lux-btn-primary" onClick={onOpenRegister}>
                  Open Private Reserve Account
                </button>
                <button type="button" className="lux-btn-secondary" onClick={onOpenLogin}>
                  Sign In to Member Portal
                </button>
              </>
            )}
          </div>
        </div>

        {/* Hero Right: Net Worth Widget */}
        <div className="hero-networth-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="networth-lbl">CURRENT RESERVE BALANCE</span>
            <button
              type="button"
              className="privacy-toggle-btn"
              onClick={() => setIsBalanceMasked(!isBalanceMasked)}
              title={isBalanceMasked ? 'Show Balance' : 'Hide Balance'}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              {isBalanceMasked ? '👁️ Show' : '🔒 Mask'}
            </button>
          </div>
          <div className="networth-amount-row">
            <span className="networth-currency">$</span>
            <span className="networth-val">
              {isBalanceMasked
                ? '••••••••'
                : displayBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="networth-meta-row">
            <span className="gold-text">Account: {userAccNumber}</span>
            <span className="member-date">Member Since {formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Strip */}
      <div className="quick-nav-strip">
        <button type="button" className="quick-nav-card" onClick={() => onNavigate('transfers')}>
          <span className="qn-icon">⚡</span>
          <div className="qn-text">
            <span className="qn-title">Send Wire / P2P</span>
            <span className="qn-desc">Real-time instant transfer</span>
          </div>
        </button>

        <button type="button" className="quick-nav-card" onClick={() => onNavigate('cards')}>
          <span className="qn-icon">💳</span>
          <div className="qn-text">
            <span className="qn-title">Titanium Cards</span>
            <span className="qn-desc">Manage limits & virtual cards</span>
          </div>
        </button>

        <button type="button" className="quick-nav-card" onClick={() => onNavigate('vault')}>
          <span className="qn-icon">📈</span>
          <div className="qn-text">
            <span className="qn-title">4.85% APY Vault</span>
            <span className="qn-desc">Simulate compound growth</span>
          </div>
        </button>

        <button type="button" className="quick-nav-card" onClick={() => onNavigate('accounts')}>
          <span className="qn-icon">🏛</span>
          <div className="qn-text">
            <span className="qn-title">Account Details</span>
            <span className="qn-desc">Routing & PDF statements</span>
          </div>
        </button>

        <button type="button" className="quick-nav-card" onClick={() => onNavigate('security')}>
          <span className="qn-icon">🛡</span>
          <div className="qn-text">
            <span className="qn-title">Audit Ledger</span>
            <span className="qn-desc">Sha-256 transaction proof</span>
          </div>
        </button>
      </div>

      {/* Main Dual Grid: Quick Transfer + Card Preview */}
      <div className="dash-dual-grid">
        {/* Left Column: Quick Transfer Card */}
        <div className="lux-card quick-transfer-card">
          <div className="lux-card-header">
            <div>
              <h3>Instant Capital Dispatch</h3>
              <p>Transfer USD zero-fee to any verified Nexus account number or username.</p>
            </div>
            <span className="badge-committed">Zero Fee</span>
          </div>

          {transferMessage && (
            <div className={`alert-banner ${transferMessage.includes('Successfully') ? 'alert-success' : 'alert-error'}`}>
              {transferMessage.includes('Successfully') ? '✓ ' : '⚠ '}
              <span>{transferMessage}</span>
            </div>
          )}

          <form onSubmit={handleTransferSubmit} className="lux-form">
            <div className="form-group">
              <label htmlFor="dash-recipient">Beneficiary Account Number or Username *</label>
              <input
                id="dash-recipient"
                type="text"
                placeholder="e.g. NX-1049281048 or sarah_stone"
                value={transferRecipient}
                onChange={(e) => setTransferRecipient(e.target.value)}
                required
                disabled={transferLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dash-amount">Transfer Amount ($ USD) *</label>
              <input
                id="dash-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                required
                disabled={transferLoading}
              />
            </div>

            <button type="submit" className="lux-btn-primary full-width" disabled={transferLoading}>
              {transferLoading ? 'Transmitting to Core Ledger...' : user ? 'Authorize & Execute Transfer' : 'Sign In to Execute Transfer'}
            </button>
          </form>
        </div>

        {/* Right Column: Interactive Titanium Card Preview */}
        <div className="lux-card mini-card-preview" onClick={() => onNavigate('cards')} style={{ cursor: 'pointer' }}>
          <div className="lux-card-header">
            <div>
              <h3>Active Titanium Debit Card</h3>
              <p>Click to open Card Studio & freeze controls</p>
            </div>
            <span className="card-active-pill">Active • Contactless</span>
          </div>

          <div className="preview-metal-card">
            <div className="pmc-top">
              <span className="pmc-crest">NX RESERVE</span>
              <span className="pmc-wifi">))))</span>
            </div>
            <div className="pmc-chip">
              <div className="emv-chip"></div>
            </div>
            <div className="pmc-number">
              {user ? `${userAccNumber.replace('NX-', '4829 ')}` : '4829 •••• •••• 8829'}
            </div>
            <div className="pmc-bottom">
              <div>
                <span className="pmc-lbl">CARDHOLDER</span>
                <span className="pmc-name">{(user?.fullName || user?.username || 'VALUED CLIENT').toUpperCase()}</span>
              </div>
              <div>
                <span className="pmc-lbl">EXPIRES</span>
                <span className="pmc-exp">08/31</span>
              </div>
            </div>
          </div>

          <div className="mini-card-actions">
            <span>Tap card to configure spending limits & instant biometric controls →</span>
          </div>
        </div>
      </div>

      {/* Full-Width Verified Transaction Ledger Card */}
      <div className="lux-card ledger-card">
        <div className="lux-card-header ledger-header">
          <div>
            <h3>Immutable Transaction History</h3>
            <p>Real-time settled ledger with SHA-256 cryptographic proof</p>
          </div>

          <div className="tx-filter-pills">
            <button
              type="button"
              className={`filter-pill ${txFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTxFilter('all')}
            >
              All Records
            </button>
            <button
              type="button"
              className={`filter-pill ${txFilter === 'credit' ? 'active' : ''}`}
              onClick={() => setTxFilter('credit')}
            >
              Deposits / Inbound
            </button>
            <button
              type="button"
              className={`filter-pill ${txFilter === 'debit' ? 'active' : ''}`}
              onClick={() => setTxFilter('debit')}
            >
              Wires / Outbound
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="ledger-empty-state">
            <div className="empty-icon">🏛</div>
            <h4>No Ledger Records Found</h4>
            <p>
              {user
                ? 'Your account is ready. Fund your account via admin deposit or execute your first outbound wire transfer.'
                : 'Sign in to review your verified transaction history.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="lux-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Description & Routing</th>
                  <th>Channel</th>
                  <th>Ledger Status</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const isDebit = tx.type === 'TRANSFER_DEBIT' || tx.type === 'debit';
                  const dateStr = tx.createdAt
                    ? new Date(tx.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent';

                  return (
                    <tr key={tx.id || tx.transactionReference || Math.random()}>
                      <td className="date-cell">{dateStr}</td>
                      <td>
                        <div className="tx-desc-title">{tx.description || tx.memo || 'Core Transaction'}</div>
                        <div className="tx-ref-code">{tx.transactionReference || 'REF-NX-PENDING'}</div>
                      </td>
                      <td>
                        <span className="channel-badge">{tx.channel || 'WEB'}</span>
                      </td>
                      <td>
                        <span className="status-badge settled">
                          <span className="status-dot"></span>
                          {tx.status || 'SETTLED'}
                        </span>
                      </td>
                      <td className={`text-right amount-cell ${isDebit ? 'amount-debit' : 'amount-credit'}`}>
                        {isDebit ? '-' : '+'}
                        ${(parseFloat(tx.amount || tx.totalAmount) || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PinPromptModal
        isOpen={isPinModalOpen}
        title="Authorize Quick Capital Dispatch"
        subtitle="Please enter your 6-digit cryptographic PIN to authorize this transfer."
        amount={transferAmount}
        recipient={transferRecipient}
        hasPinSet={user?.hasPinSet !== false}
        onConfirm={handlePinConfirm}
        onClose={() => setIsPinModalOpen(false)}
        onNavigateToSetPin={() => {
          if (onNavigate) onNavigate('profile');
        }}
      />
    </div>
  );
}

export default Dashboard;
