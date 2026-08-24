import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config.js';

function CardsView({ user }) {
  const [cards, setCards] = useState([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCards = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/cards/user/${user.id}`);
      const data = await res.json();
      if (res.ok && data?.success && Array.isArray(data.data) && data.data.length > 0) {
        setCards(data.data);
      } else {
        setCards([]);
      }
    } catch (err) {
      console.error('Failed to fetch cards:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const currentCard = cards[activeCardIndex] || cards[0];

  const showToast = (msg, isErr = false) => {
    if (isErr) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    } else {
      setNotification(msg);
      setTimeout(() => setNotification(''), 4000);
    }
  };

  const handleToggleFreeze = async () => {
    if (!currentCard?.id) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/cards/${currentCard.id}/freeze`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        const updatedCard = data.data;
        setCards((prev) =>
          prev.map((c) => (c.id === updatedCard.id ? updatedCard : c))
        );
        showToast(
          updatedCard.isFrozen
            ? `Card ${updatedCard.cardNumberMasked} is now LOCKED & FROZEN.`
            : `Card ${updatedCard.cardNumberMasked} is now UNLOCKED & ACTIVE.`
        );
      } else {
        showToast(data?.message || 'Failed to update card status in core ledger.', true);
      }
    } catch (err) {
      console.error('Error freezing card:', err);
      showToast('Network error: Could not reach card authorization service.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLimitChange = async (newLimit) => {
    if (!currentCard?.id) return;
    const numLimit = parseFloat(newLimit);

    // Optimistic update
    setCards((prev) =>
      prev.map((c, idx) =>
        idx === activeCardIndex ? { ...c, spendingLimitMonthly: numLimit } : c
      )
    );

    try {
      const res = await fetch(`${API_BASE_URL}/api/cards/${currentCard.id}/limits`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyLimit: numLimit,
          dailyAtmLimit: currentCard.atmWithdrawalLimitDaily || 5000,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        showToast(data?.message || 'Failed to sync limit to core ledger.', true);
      }
    } catch (err) {
      console.error('Error updating limit:', err);
    }
  };

  const handleToggleContactless = async () => {
    if (!currentCard?.id) return;
    const newContactless = !currentCard.isContactlessEnabled;

    setCards((prev) =>
      prev.map((c, idx) =>
        idx === activeCardIndex ? { ...c, isContactlessEnabled: newContactless } : c
      )
    );

    try {
      await fetch(`${API_BASE_URL}/api/cards/${currentCard.id}/channels`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isContactlessEnabled: newContactless,
          isInternationalEnabled: currentCard.isInternationalEnabled,
        }),
      });
      showToast(`Contactless & online payments ${newContactless ? 'ENABLED' : 'DISABLED'}.`);
    } catch (err) {
      console.error('Error updating channels:', err);
    }
  };

  const handleIssueVirtualCard = async () => {
    if (!user?.id) {
      showToast('Please sign in to issue virtual cards.', true);
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/cards/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          accountNumber: user.accountNumber,
          cardType: 'VIRTUAL_DISPOSABLE',
          monthlyLimit: 5000.0,
          dailyAtmLimit: 1000.0,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        const newCard = data.data;
        setCards((prev) => [...prev, newCard]);
        setActiveCardIndex(cards.length);
        setIsFlipped(false);
        showToast(`Instant Virtual Card issued successfully: ${newCard.cardNumberMasked}`);
      } else {
        showToast(data?.message || 'Failed to issue virtual card.', true);
      }
    } catch (err) {
      console.error('Error issuing virtual card:', err);
      showToast('Could not reach card issuing service.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const holderName = user?.fullName || user?.username || 'NEXUS CLIENT';

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-badge">Payment Instruments & Cards Studio</div>
        <h1 className="view-title">Titanium & Virtual Cards</h1>
        <p className="view-subtitle">
          Configure real-time security locks, issue single-use virtual cards, and adjust authorizations synced directly with the core ledger.
        </p>
      </div>

      {notification && (
        <div className="alert-banner alert-success">
          ✓ <span>{notification}</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert-banner alert-error">
          ⚠ <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="empty-state-box" style={{ padding: '60px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 16px' }}></div>
          <p>Syncing cards with core banking ledger...</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="empty-state-box" style={{ padding: '50px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '42px', marginBottom: '16px' }}>💳</div>
          <h3 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>No Payment Cards Found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
            {user ? 'Issue your first instant virtual or physical titanium card.' : 'Sign in to access your card portfolio.'}
          </p>
          {user && (
            <button
              type="button"
              className="lux-btn-primary"
              onClick={handleIssueVirtualCard}
              disabled={actionLoading}
            >
              {actionLoading ? 'Issuing Card...' : '+ Issue Instant Virtual Card'}
            </button>
          )}
        </div>
      ) : (
        <div className="cards-layout-grid">
          {/* 3D Interactive Card Showcase */}
          <div className="card-stage-column">
            <div className="card-selector-tabs">
              {cards.map((c, idx) => (
                <button
                  key={c.id}
                  type="button"
                  className={`card-tab-btn ${activeCardIndex === idx ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCardIndex(idx);
                    setIsFlipped(false);
                  }}
                >
                  {c.cardType === 'TITANIUM_PHYSICAL' ? 'Titanium Physical' : `Virtual Card #${idx + 1}`}
                  {c.isFrozen && ' 🔒'}
                </button>
              ))}
              <button
                type="button"
                className="card-tab-btn add-virtual-btn"
                onClick={handleIssueVirtualCard}
                disabled={actionLoading}
              >
                + Issue Virtual
              </button>
            </div>

            {/* Interactive Card Canvas */}
            {currentCard && (
              <div
                className={`lux-3d-card-wrapper ${isFlipped ? 'is-flipped' : ''} ${currentCard.isFrozen ? 'is-frozen' : ''} ${
                  currentCard.cardType === 'TITANIUM_PHYSICAL' ? 'titanium-gold' : 'obsidian-purple'
                }`}
                onClick={() => setIsFlipped(!isFlipped)}
                title="Click to flip and inspect CVV / Expiration"
              >
                {/* FRONT OF CARD */}
                <div className="lux-card-face card-front">
                  <div className="card-front-top">
                    <div className="card-brand-mark">
                      <span className="gold-crest">NX</span>
                      <span className="card-brand-name">
                        {currentCard.cardType === 'TITANIUM_PHYSICAL' ? 'TITANIUM RESERVE' : 'CLOUD VIRTUAL'}
                      </span>
                    </div>
                    <div className="contactless-icon">))))</div>
                  </div>

                  <div className="card-chip-container">
                    <div className="emv-chip"></div>
                    {currentCard.isFrozen && <span className="frozen-overlay-badge">🔒 CARD FROZEN</span>}
                  </div>

                  <div className="card-number-display">
                    {currentCard.cardNumberMasked}
                  </div>

                  <div className="card-front-bottom">
                    <div className="card-holder-info">
                      <span className="card-lbl">CARDHOLDER</span>
                      <span className="card-val">{currentCard.cardholderName || holderName.toUpperCase()}</span>
                    </div>
                    <div className="card-expiry-info">
                      <span className="card-lbl">EXPIRES</span>
                      <span className="card-val">{currentCard.expirationDate || '08/31'}</span>
                    </div>
                    <div className="card-type-logo">
                      <span className="visa-text">NEXUS</span>
                    </div>
                  </div>
                </div>

                {/* BACK OF CARD */}
                <div className="lux-card-face card-back">
                  <div className="mag-stripe"></div>
                  <div className="signature-cvv-panel">
                    <div className="signature-strip">AUTHORIZED SIGNATURE • NEXUS RESERVE VERIFIED</div>
                    <div className="cvv-box">
                      <span className="cvv-lbl">CVV</span>
                      <span className="cvv-num">829</span>
                    </div>
                  </div>
                  <p className="card-back-disclaimer">
                    Linked to Account: {currentCard.accountNumber}. Token: {currentCard.cardTokenHash?.substring(0, 16)}...
                  </p>
                </div>
              </div>
            )}

            <p className="flip-hint">👆 Click the card anytime to flip and view the encrypted security panel.</p>
          </div>

          {/* Card Controls & Limits Card */}
          {currentCard && (
            <div className="lux-card card-controls-panel">
              <div className="lux-card-header">
                <h3>Card Security & Controls</h3>
                <p>Card ID #{currentCard.id} • {currentCard.cardNumberMasked}</p>
              </div>

              <div className="controls-list">
                {/* Freeze Toggle */}
                <div className="control-toggle-row">
                  <div>
                    <span className="control-title">Freeze Card Instantly</span>
                    <span className="control-desc">
                      Instantly blocks all authorizations, POS charges, and ATM withdrawals.
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`toggle-switch-btn ${currentCard.isFrozen ? 'active-red' : ''}`}
                    onClick={handleToggleFreeze}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'UPDATING...' : currentCard.isFrozen ? 'FROZEN' : 'ACTIVE'}
                  </button>
                </div>

                {/* Online Transactions */}
                <div className="control-toggle-row">
                  <div>
                    <span className="control-title">Online & Contactless Payments</span>
                    <span className="control-desc">Enable digital wallet and merchant NFC channels in real time.</span>
                  </div>
                  <button
                    type="button"
                    className={`toggle-switch-btn ${currentCard.isContactlessEnabled ? 'active-gold' : ''}`}
                    onClick={handleToggleContactless}
                  >
                    {currentCard.isContactlessEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                {/* Spending Limit Slider */}
                <div className="limit-slider-box">
                  <div className="limit-header-row">
                    <span className="control-title">Monthly Spending Limit</span>
                    <span className="gold-limit-num">
                      ${parseFloat(currentCard.spendingLimitMonthly || 25000).toLocaleString()} USD
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="50000"
                    step="500"
                    value={parseFloat(currentCard.spendingLimitMonthly || 25000)}
                    onChange={(e) => handleLimitChange(e.target.value)}
                    className="lux-slider"
                  />
                  <div className="slider-labels">
                    <span>$500 Min</span>
                    <span>$50,000 Max</span>
                  </div>
                </div>
              </div>

              <div className="card-actions-footer">
                <button
                  type="button"
                  className="lux-btn-primary full-width"
                  onClick={handleIssueVirtualCard}
                  disabled={actionLoading}
                >
                  + Issue Additional Disposable Virtual Card
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CardsView;
