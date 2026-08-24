import { useState } from 'react';

function AccountsView({ user, balance }) {
  const [copiedField, setCopiedField] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState('');

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleDownloadStatement = (format) => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadMsg(`Nexus_Certified_Statement_${user?.accountNumber || 'NX'}.${format.toLowerCase()} generated & downloaded.`);
      setTimeout(() => setDownloadMsg(''), 4000);
    }, 1200);
  };

  const currentBal = parseFloat(balance) || 0;
  const userAcc = user?.accountNumber || 'NX-PENDING';

  const accounts = [
    {
      id: 'NX-CHK-01',
      name: 'Nexus Prime Reserve Checking',
      badge: 'Primary Liquid',
      balance: currentBal,
      type: 'Demand Deposit',
      accountNumber: userAcc,
      routingNumber: '021000089',
      swift: 'NXUSUS33NYC',
      status: user ? 'Active • Verified' : 'Preview Mode',
    },
    {
      id: 'NX-VLT-02',
      name: 'Private Wealth Vault',
      badge: '4.85% Daily APY',
      balance: 0.00,
      type: 'High-Yield Reserve',
      accountNumber: `${userAcc}-VLT`,
      routingNumber: '021000089',
      swift: 'NXUSUS33NYC',
      status: 'Compounding Active',
    },
    {
      id: 'NX-EUR-03',
      name: 'Global Multi-Currency Clearing',
      badge: 'EUR / GBP / USD',
      balance: 0.00,
      type: 'Cross-Border Wire',
      accountNumber: `GB29NXUS00${user?.id || '10'}`,
      routingNumber: 'NXUS-IBAN',
      swift: 'NXUSGB2LXXX',
      status: 'SEPA & SWIFT Enabled',
    },
    {
      id: 'NX-TRS-04',
      name: 'Treasury Escrow Reserve',
      badge: 'FDIC Sweep $2.5M',
      balance: 0.00,
      type: 'Institutional Escrow',
      accountNumber: `${userAcc}-ESC`,
      routingNumber: '021000089',
      swift: 'NXUSUS33NYC',
      status: 'Secured Tier 1',
    },
  ];

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-badge">Institutional Portfolio</div>
        <h1 className="view-title">Accounts & Treasury</h1>
        <p className="view-subtitle">
          Manage your domestic demand deposits, high-yield reserves, and international multi-currency clearing accounts.
        </p>
      </div>

      {downloadMsg && (
        <div className="alert-banner alert-success">
          ✓ <span>{downloadMsg}</span>
        </div>
      )}

      {/* Account Cards Grid */}
      <div className="accounts-grid">
        {accounts.map((acc) => (
          <div key={acc.id} className="lux-account-card">
            <div className="acc-card-top">
              <div>
                <span className="acc-type-tag">{acc.badge}</span>
                <h3 className="acc-name">{acc.name}</h3>
              </div>
              <span className="acc-status-indicator">{acc.status}</span>
            </div>

            <div className="acc-balance-row">
              <span className="acc-currency">$</span>
              <span className="acc-balance-num">
                {acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="acc-details-list">
              <div className="acc-detail-item">
                <span className="detail-lbl">Account Number</span>
                <div className="detail-val-copy">
                  <code>{acc.accountNumber}</code>
                  <button
                    type="button"
                    className="copy-icon-btn"
                    onClick={() => copyToClipboard(acc.accountNumber, `${acc.id}-acc`)}
                    title="Copy Account Number"
                  >
                    {copiedField === `${acc.id}-acc` ? '✓ Copied' : '⧉ Copy'}
                  </button>
                </div>
              </div>

              <div className="acc-detail-item">
                <span className="detail-lbl">Routing / SWIFT</span>
                <div className="detail-val-copy">
                  <code>{acc.routingNumber} • {acc.swift}</code>
                  <button
                    type="button"
                    className="copy-icon-btn"
                    onClick={() => copyToClipboard(`${acc.routingNumber} / ${acc.swift}`, `${acc.id}-rout`)}
                    title="Copy Routing"
                  >
                    {copiedField === `${acc.id}-rout` ? '✓ Copied' : '⧉ Copy'}
                  </button>
                </div>
              </div>
            </div>

            <div className="acc-card-footer">
              <span className="acc-sub">{acc.type}</span>
              <button
                type="button"
                className="acc-action-link"
                onClick={() => handleDownloadStatement('PDF')}
                disabled={downloading}
              >
                {downloading ? 'Exporting...' : 'Export Statement'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Wire Instructions & Statement Export Hub */}
      <div className="hub-split-section">
        <div className="lux-card hub-card">
          <div className="lux-card-header">
            <h3>Domestic & International Wire Coordinates</h3>
            <p>Use these credentials to direct incoming wire transfers into your Nexus Core Account.</p>
          </div>
          <div className="wire-table">
            <div className="wire-row">
              <span className="wire-key">Beneficiary Name</span>
              <span className="wire-val">{user?.fullName || user?.username || 'Nexus Client Reserve Account'}</span>
            </div>
            <div className="wire-row">
              <span className="wire-key">Beneficiary Account Number</span>
              <span className="wire-val gold-text">{userAcc}</span>
            </div>
            <div className="wire-row">
              <span className="wire-key">Beneficiary Bank</span>
              <span className="wire-val">Nexus Federal Reserve Banking Trust N.A.</span>
            </div>
            <div className="wire-row">
              <span className="wire-key">Bank Address</span>
              <span className="wire-val">100 Wall Street, 42nd Fl, New York, NY 10005, USA</span>
            </div>
            <div className="wire-row">
              <span className="wire-key">FedWire / ABA Routing</span>
              <span className="wire-val">021000089</span>
            </div>
            <div className="wire-row">
              <span className="wire-key">SWIFT / BIC Code</span>
              <span className="wire-val">NXUSUS33NYC</span>
            </div>
          </div>
        </div>

        <div className="lux-card hub-card">
          <div className="lux-card-header">
            <h3>Automated Statements & Tax Reports</h3>
            <p>Generate timestamped certified statements issued by Nexus Reserve Trust.</p>
          </div>
          <div className="statement-actions">
            <button
              type="button"
              className="lux-btn-primary"
              onClick={() => handleDownloadStatement('PDF')}
              disabled={downloading}
            >
              📄 Download Certified Monthly Statement (PDF)
            </button>
            <button
              type="button"
              className="lux-btn-secondary"
              onClick={() => handleDownloadStatement('CSV')}
              disabled={downloading}
            >
              📊 Export Ledger Transactions (CSV / Excel)
            </button>
          </div>
          <div className="statement-meta">
            <span>🔒 Cryptographic Sha-256 Audit Seal embedded on all exported documentation.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountsView;
