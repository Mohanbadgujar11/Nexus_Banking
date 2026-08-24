import { useState } from 'react';

function TransfersView({ user, balance, onExecuteTransfer, onOpenLogin }) {
  const [transferTab, setTransferTab] = useState('instant'); // 'instant' | 'swift' | 'scheduled'
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    note: '',
    currency: 'USD',
    frequency: 'Monthly',
    swiftBic: '',
    country: 'United Kingdom (GBP)',
  });
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [transferStep, setTransferStep] = useState(null); // 'processing' | 'done'

  const fxRates = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.78,
    CHF: 0.88,
    JPY: 154.2,
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      if (onOpenLogin) onOpenLogin();
      return;
    }

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid transfer amount.' });
      return;
    }

    const currentBalance = parseFloat(balance) || 0;
    if (amt > currentBalance) {
      setStatusMsg({ type: 'error', text: 'Insufficient available funds in your Nexus account.' });
      return;
    }

    setTransferStep('processing');
    setStatusMsg({ type: '', text: '' });

    try {
      const result = await onExecuteTransfer(amt, formData.recipient.trim(), formData.note || `Transfer to ${formData.recipient}`);
      if (result?.success) {
        setTransferStep('done');
        setStatusMsg({
          type: 'success',
          text: `Transferred $${amt.toFixed(2)} to ${formData.recipient} successfully!`,
        });
        setFormData({ recipient: '', amount: '', note: '', currency: 'USD', frequency: 'Monthly', swiftBic: '', country: 'United Kingdom (GBP)' });
      } else {
        setTransferStep(null);
        setStatusMsg({
          type: 'error',
          text: result?.message || 'Transfer failed.',
        });
      }
    } catch {
      setTransferStep(null);
      setStatusMsg({ type: 'error', text: 'Failed to communicate with transfer engine.' });
    } finally {
      setTimeout(() => setTransferStep(null), 4000);
    }
  };

  const convertedAmount = formData.amount && !isNaN(formData.amount)
    ? (parseFloat(formData.amount) * (fxRates[formData.currency] || 1)).toFixed(2)
    : '0.00';

  const userAcc = user?.accountNumber || 'NX-PENDING';
  const displayBal = parseFloat(balance) || 0;

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-badge">Global Capital Movement</div>
        <h1 className="view-title">Transfers & Settlements</h1>
        <p className="view-subtitle">
          Execute instant zero-fee peer transactions, high-throughput SWIFT/SEPA global wires, and automated recurring payment schedules.
        </p>
      </div>

      {statusMsg.text && (
        <div className={`alert-banner ${statusMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="transfer-layout-grid">
        {/* Main Transfer Form Card */}
        <div className="lux-card transfer-main-card">
          <div className="transfer-tabs">
            <button
              type="button"
              className={`transfer-tab-btn ${transferTab === 'instant' ? 'active' : ''}`}
              onClick={() => setTransferTab('instant')}
            >
              ⚡ Instant P2P (Zero Fee)
            </button>
            <button
              type="button"
              className={`transfer-tab-btn ${transferTab === 'swift' ? 'active' : ''}`}
              onClick={() => setTransferTab('swift')}
            >
              🌐 Global SWIFT Wire
            </button>
            <button
              type="button"
              className={`transfer-tab-btn ${transferTab === 'scheduled' ? 'active' : ''}`}
              onClick={() => setTransferTab('scheduled')}
            >
              ⏱ Scheduled Recurring
            </button>
          </div>

          <form onSubmit={handleSubmit} className="lux-form">
            {transferTab === 'instant' && (
              <>
                <div className="form-group">
                  <label htmlFor="p2p-recipient">Beneficiary Account Number or Username *</label>
                  <input
                    id="p2p-recipient"
                    name="recipient"
                    type="text"
                    placeholder="e.g. NX-1049281048 or alex_stone"
                    value={formData.recipient}
                    onChange={handleInputChange}
                    required
                    disabled={transferStep === 'processing'}
                  />
                </div>

                <div className="form-row-dual">
                  <div className="form-group">
                    <label htmlFor="p2p-amount">Amount ($ USD) *</label>
                    <input
                      id="p2p-amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                      disabled={transferStep === 'processing'}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="p2p-note">Reference / Memo</label>
                    <input
                      id="p2p-note"
                      name="note"
                      type="text"
                      placeholder="e.g. Consulting Invoice #2049"
                      value={formData.note}
                      onChange={handleInputChange}
                      disabled={transferStep === 'processing'}
                    />
                  </div>
                </div>
              </>
            )}

            {transferTab === 'swift' && (
              <>
                <div className="form-row-dual">
                  <div className="form-group">
                    <label htmlFor="wire-country">Destination Country & Currency</label>
                    <select
                      id="wire-country"
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                    >
                      <option value="EUR">European Union (EUR €)</option>
                      <option value="GBP">United Kingdom (GBP £)</option>
                      <option value="CHF">Switzerland (CHF ₣)</option>
                      <option value="JPY">Japan (JPY ¥)</option>
                      <option value="USD">United States (USD $)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="wire-bic">SWIFT / BIC Code</label>
                    <input
                      id="wire-bic"
                      name="swiftBic"
                      type="text"
                      placeholder="e.g. DEUTDEDBFXX"
                      value={formData.swiftBic}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="wire-iban">Recipient IBAN / Global Account Number</label>
                  <input
                    id="wire-iban"
                    name="recipient"
                    type="text"
                    placeholder="e.g. DE89 3704 0044 0532 0130 00"
                    value={formData.recipient}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-row-dual">
                  <div className="form-group">
                    <label htmlFor="wire-amount">Send Amount (USD $)</label>
                    <input
                      id="wire-amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Recipient Receives ({formData.currency})</label>
                    <div className="fx-preview-box">
                      <span className="fx-value">{convertedAmount} {formData.currency}</span>
                      <span className="fx-rate-lbl">Rate: 1 USD = {fxRates[formData.currency]} {formData.currency}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {transferTab === 'scheduled' && (
              <>
                <div className="form-group">
                  <label htmlFor="sch-recipient">Beneficiary Account or Name</label>
                  <input
                    id="sch-recipient"
                    name="recipient"
                    type="text"
                    placeholder="e.g. NX-1049281048 or Highland Trust"
                    value={formData.recipient}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-row-dual">
                  <div className="form-group">
                    <label htmlFor="sch-amount">Recurring Amount ($ USD)</label>
                    <input
                      id="sch-amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="sch-freq">Execution Frequency</label>
                    <select
                      id="sch-freq"
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleInputChange}
                    >
                      <option value="Weekly">Weekly (Every Monday)</option>
                      <option value="Bi-Weekly">Bi-Weekly (1st & 15th)</option>
                      <option value="Monthly">Monthly (1st of Month)</option>
                      <option value="Quarterly">Quarterly</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="transfer-summary-box">
              <div className="summary-line">
                <span>Funding Account</span>
                <span className="gold-text">{userAcc} (${displayBal.toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
              </div>
              <div className="summary-line">
                <span>Network Settlement Fee</span>
                <span className="green-text">{transferTab === 'swift' ? '$15.00 (Fixed Wire)' : '$0.00 (Zero Fee)'}</span>
              </div>
              <div className="summary-line">
                <span>Estimated Clearance</span>
                <span>{transferTab === 'instant' ? 'Instant (< 250ms)' : 'Same-Day FedWire'}</span>
              </div>
            </div>

            <button type="submit" className="lux-btn-primary full-width" disabled={transferStep === 'processing'}>
              {transferStep === 'processing' ? 'Encrypting & Routing to Core Ledger...' : user ? 'Authorize & Execute Transfer' : 'Sign In to Authorize'}
            </button>
          </form>
        </div>

        {/* Live Settlement Pipeline Tracker */}
        <div className="lux-card tracker-card">
          <div className="lux-card-header">
            <h3>Settlement Lifecycle Monitor</h3>
            <p>Cryptographic real-time tracking for outbound transactions.</p>
          </div>

          <div className="settlement-steps">
            <div className={`step-item ${transferStep ? 'active' : 'completed'}`}>
              <div className="step-num">1</div>
              <div className="step-info">
                <h4>Intent Cryptographically Signed</h4>
                <p>Private client key verifies transfer signature.</p>
              </div>
            </div>

            <div className={`step-item ${transferStep ? 'active' : 'completed'}`}>
              <div className="step-num">2</div>
              <div className="step-info">
                <h4>Zero-Knowledge AML Screening</h4>
                <p>Automated Sanction & OFAC compliance verification.</p>
              </div>
            </div>

            <div className={`step-item ${transferStep === 'done' || !transferStep ? 'completed' : 'pending'}`}>
              <div className="step-num">3</div>
              <div className="step-info">
                <h4>Core Ledger Committed</h4>
                <p>Atomic double-entry debit/credit commit across reserves.</p>
              </div>
            </div>

            <div className={`step-item ${transferStep === 'done' || !transferStep ? 'completed' : 'pending'}`}>
              <div className="step-num">4</div>
              <div className="step-info">
                <h4>Beneficiary Funds Settled</h4>
                <p>Instant clearance confirmation token dispatched.</p>
              </div>
            </div>
          </div>

          <div className="security-notice-box">
            <span>🛡 All transfers backed by Nexus Core double-entry transactional guarantee and FDIC insured routing.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransfersView;
