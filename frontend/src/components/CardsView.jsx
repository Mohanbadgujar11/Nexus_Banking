import { useState } from 'react';

function CardsView({ user }) {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState([
    {
      id: 'card-1',
      type: 'Titanium Reserve (Physical)',
      number: '4829 •••• •••• 8829',
      fullNumber: '4829 9012 3341 8829',
      holder: user?.username ? user.username.toUpperCase() : 'ALEX STONE',
      expiry: '08/31',
      cvv: '782',
      status: 'Active',
      limit: 25000,
      frozen: false,
      onlineActive: true,
      internationalActive: true,
      theme: 'titanium-gold',
    },
    {
      id: 'card-2',
      type: 'Disposable Virtual Card',
      number: '4112 •••• •••• 4402',
      fullNumber: '4112 8840 1920 4402',
      holder: user?.username ? user.username.toUpperCase() : 'ALEX STONE',
      expiry: '12/28',
      cvv: '319',
      status: 'Active',
      limit: 5000,
      frozen: false,
      onlineActive: true,
      internationalActive: false,
      theme: 'obsidian-purple',
    },
  ]);

  const [notification, setNotification] = useState('');

  const currentCard = cards[activeCardIndex] || cards[0];

  const toggleFreeze = () => {
    const updated = [...cards];
    updated[activeCardIndex].frozen = !updated[activeCardIndex].frozen;
    setCards(updated);
    setNotification(
      updated[activeCardIndex].frozen
        ? `${currentCard.type} has been locked & frozen.`
        : `${currentCard.type} has been unlocked.`
    );
    setTimeout(() => setNotification(''), 3500);
  };

  const toggleOnline = () => {
    const updated = [...cards];
    updated[activeCardIndex].onlineActive = !updated[activeCardIndex].onlineActive;
    setCards(updated);
  };

  const handleLimitChange = (newLimit) => {
    const updated = [...cards];
    updated[activeCardIndex].limit = parseInt(newLimit, 10);
    setCards(updated);
  };

  const handleCreateVirtualCard = () => {
    const random4 = Math.floor(1000 + Math.random() * 9000);
    const newCard = {
      id: `card-${Date.now()}`,
      type: `Virtual Cloud Card #${cards.length + 1}`,
      number: `4290 •••• •••• ${random4}`,
      fullNumber: `4290 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${random4}`,
      holder: user?.username ? user.username.toUpperCase() : 'ALEX STONE',
      expiry: '09/29',
      cvv: `${Math.floor(100 + Math.random() * 900)}`,
      status: 'Active',
      limit: 3000,
      frozen: false,
      onlineActive: true,
      internationalActive: true,
      theme: 'emerald-luxury',
    };
    setCards([...cards, newCard]);
    setActiveCardIndex(cards.length);
    setNotification('Fresh instant disposable virtual card issued with encrypted CVV.');
    setTimeout(() => setNotification(''), 3500);
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-badge">Card Management Studio</div>
        <h1 className="view-title">Titanium & Virtual Cards</h1>
        <p className="view-subtitle">
          Configure security locks, generate single-use virtual cards, and adjust real-time spending limits.
        </p>
      </div>

      {notification && (
        <div className="alert-banner alert-success">
          ✓ <span>{notification}</span>
        </div>
      )}

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
                {c.type}
              </button>
            ))}
            <button
              type="button"
              className="card-tab-btn add-virtual-btn"
              onClick={handleCreateVirtualCard}
            >
              + Issue Virtual Card
            </button>
          </div>

          {/* Interactive Card Canvas */}
          <div
            className={`lux-3d-card-wrapper ${isFlipped ? 'is-flipped' : ''} ${currentCard.frozen ? 'is-frozen' : ''} ${currentCard.theme}`}
            onClick={() => setIsFlipped(!isFlipped)}
            title="Click to flip and inspect CVV / Expiration"
          >
            {/* FRONT OF CARD */}
            <div className="lux-card-face card-front">
              <div className="card-front-top">
                <div className="card-brand-mark">
                  <span className="gold-crest">NX</span>
                  <span className="card-brand-name">NEXUS RESERVE</span>
                </div>
                <div className="contactless-icon">))))</div>
              </div>

              <div className="card-chip-container">
                <div className="emv-chip"></div>
                {currentCard.frozen && <span className="frozen-overlay-badge">🔒 FROZEN</span>}
              </div>

              <div className="card-number-display">
                {isFlipped ? currentCard.fullNumber : currentCard.number}
              </div>

              <div className="card-front-bottom">
                <div className="card-holder-info">
                  <span className="card-lbl">CARDHOLDER</span>
                  <span className="card-val">{currentCard.holder}</span>
                </div>
                <div className="card-expiry-info">
                  <span className="card-lbl">EXPIRES</span>
                  <span className="card-val">{currentCard.expiry}</span>
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
                <div className="signature-strip">AUTHORIZED SIGNATURE • NOT VALID UNLESS SIGNED</div>
                <div className="cvv-box">
                  <span className="cvv-lbl">CVV</span>
                  <span className="cvv-num">{currentCard.cvv}</span>
                </div>
              </div>
              <p className="card-back-disclaimer">
                Issued by Nexus Federal Trust N.A. Member FDIC. For customer concierge call 1-800-NEXUS-CORE.
              </p>
            </div>
          </div>

          <p className="flip-hint">👆 Click the card anytime to flip and view the CVV and security panel.</p>
        </div>

        {/* Card Controls & Limits Card */}
        <div className="lux-card card-controls-panel">
          <div className="lux-card-header">
            <h3>Card Security Controls</h3>
            <p>Real-time settings for {currentCard.type}</p>
          </div>

          <div className="controls-list">
            {/* Freeze Toggle */}
            <div className="control-toggle-row">
              <div>
                <span className="control-title">Freeze Card Instantly</span>
                <span className="control-desc">Block all transactions, authorizations, and ATM withdrawals.</span>
              </div>
              <button
                type="button"
                className={`toggle-switch-btn ${currentCard.frozen ? 'active-red' : ''}`}
                onClick={toggleFreeze}
              >
                {currentCard.frozen ? 'FROZEN' : 'ACTIVE'}
              </button>
            </div>

            {/* Online Transactions */}
            <div className="control-toggle-row">
              <div>
                <span className="control-title">Online & Contactless Payments</span>
                <span className="control-desc">Permit digital wallet and internet merchant charges.</span>
              </div>
              <button
                type="button"
                className={`toggle-switch-btn ${currentCard.onlineActive ? 'active-gold' : ''}`}
                onClick={toggleOnline}
              >
                {currentCard.onlineActive ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            {/* Spending Limit Slider */}
            <div className="limit-slider-box">
              <div className="limit-header-row">
                <span className="control-title">Daily Authorization Limit</span>
                <span className="gold-limit-num">${currentCard.limit.toLocaleString()} USD</span>
              </div>
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={currentCard.limit}
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
              onClick={handleCreateVirtualCard}
            >
              + Issue Additional Single-Use Virtual Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardsView;

