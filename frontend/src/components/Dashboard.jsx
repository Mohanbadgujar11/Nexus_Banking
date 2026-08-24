import { useState } from 'react';

function Dashboard({ user, balance, transactions, onExecuteTransfer, onNavigate, onOpenLogin, onOpenRegister }) {
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [txFilter, setTxFilter] = useState('all'); // 'all' | 'credit' | 'debit'
  const [transferLoading, setTransferLoading] = useState(false);

  const handleTransfer = async (e) => {
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

    setTransferLoading(true);
    setTransferMessage('');

    try {
      const result = await onExecuteTransfer(amt, transferRecipient.trim(), `Instant Transfer to ${transferRecipient.trim()}`);
      if (result?.success) {
        setTransferMessage(`Successfully executed $${amt.toFixed(2)} transfer to ${transferRecipient}!`);
        setTransferAmount('');
        setTransferRecipient('');
      } else {
        setTransferMessage(result?.message || 'Transfer failed.');
      }
    } catch {
      setTransferMessage('Error connecting to transfer service.');
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
              {user ? (user.role === 'ROLE_ADMIN' ? '🛡 Core Bank Administrator' : 'Private Reserve Client') : 'Institutional Core Gateway'}
            </span>
            <span className="hero-security-pill">🔒 Double-Entry Verified</span>
          </div>

          <h1 className="hero-heading">
            Hello {user?.fullName ? `${user.fullName}, ` : user?.username ? `${user.username}, ` : ''}Welcome to the Nexus Bank!
          </h1>
          <p className="hero-description">
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
          <span className="networth-lbl">CURRENT RESERVE BALANCE</span>
          <div className="networth-amount-row">
            <span className="networth-currency">$</span>
            <span className="networth-val">
              {displayBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

      {/* Dashboard Main Grid */}
      <div className="dashboard-grid-layout">
        {/* Left Column: Quick Transfer Form */}
        <div className="lux-card">
          <div className="lux-card-header">
            <div>
              <h3>Instant Settlement Terminal</h3>
              <p>Transfer funds to any Nexus Account Number or Username</p>
            </div>
            <span className="zero-fee-pill">Real-Time Core API</span>
          </div>

          {transferMessage && (
            <div className={`alert-banner ${transferMessage.includes('Successfully') ? 'alert-success' : 'alert-error'}`}>
              <span>{transferMessage}</span>
            </div>
          )}

          <form onSubmit={handleTransfer} className="lux-form">
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
              {transferLoading ? 'Transmitting to Core Ledger...' : user ? 'Execute Real-Time Transfer' : 'Sign In to Execute Transfer'}
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
                <span className="pmc-val">{user?.fullName ? user.fullName.toUpperCase() : user?.username ? user.username.toUpperCase() : 'ALEX STONE'}</span>
              </div>
              <div>
                <span className="pmc-lbl">EXPIRES</span>
                <span className="pmc-val">08/31</span>
              </div>
              <span className="pmc-type">NEXUS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Transaction Ledger */}
      <div className="lux-card ledger-card">
        <div className="ledger-header-row">
          <div>
            <h3>Real-Time Account Ledger</h3>
            <p>Transactions committed to the MySQL ACID database</p>
          </div>

          <div className="tx-filter-group">
            <button
              type="button"
              className={`tx-filter-btn ${txFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTxFilter('all')}
            >
              All ({filteredTransactions.length})
            </button>
            <button
              type="button"
              className={`tx-filter-btn ${txFilter === 'credit' ? 'active' : ''}`}
              onClick={() => setTxFilter('credit')}
            >
              ↓ Inflow
            </button>
            <button
              type="button"
              className={`tx-filter-btn ${txFilter === 'debit' ? 'active' : ''}`}
              onClick={() => setTxFilter('debit')}
            >
              ↑ Outflow
            </button>
          </div>
        </div>

        <div className="tx-table-container">
          <table className="lux-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Description / Reference</th>
                <th>Counterparty</th>
                <th>Timestamp</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📂</div>
                    <strong>No transactions yet.</strong>
                    <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
                      {user?.role === 'ROLE_ADMIN'
                        ? 'Use the Admin Console to deposit funds into client accounts.'
                        : 'Deposit funds or receive an instant transfer to populate your ledger.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isCredit = tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_CREDIT' || tx.type === 'credit';
                  return (
                    <tr key={tx.id}>
                      <td>
                        <span className={`lux-tx-badge ${isCredit ? 'credit' : 'debit'}`}>
                          {isCredit ? '↓ Credit' : '↑ Debit'}
                        </span>
                      </td>
                      <td>
                        <strong>{tx.description || tx.title || 'P2P Transfer'}</strong>
                        <div className="tx-time-col">{tx.transactionReference || `TXN-${tx.id}`}</div>
                      </td>
                      <td>
                        <code>{isCredit ? (tx.senderAccountNumber || 'Treasury Deposit') : tx.receiverAccountNumber}</code>
                      </td>
                      <td className="tx-time-col">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : tx.date || 'Recent'}
                      </td>
                      <td><span className="badge-committed">Settled</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`tx-amount-text ${isCredit ? 'credit' : 'debit'}`}>
                          {isCredit ? '+' : '-'}
                          ${(parseFloat(tx.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
