import { useState, useRef, useEffect } from 'react';

function PinPromptModal({
  isOpen,
  title = 'Security PIN Required',
  subtitle = 'Please verify your 6-digit transaction PIN to authorize this banking operation.',
  amount,
  recipient,
  hasPinSet = true,
  onConfirm,
  onClose,
  onNavigateToSetPin,
}) {
  const [pinDigits, setPinDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setPinDigits(['', '', '', '', '', '']);
      setError('');
      setLoading(false);
      if (hasPinSet) {
        setTimeout(() => {
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
          }
        }, 100);
      }
    }
  }, [isOpen, hasPinSet]);

  if (!isOpen) return null;

  const handleDigitChange = (index, value) => {
    // Only accept single numeric digit
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = cleaned;
    setPinDigits(newDigits);
    setError('');

    // Automatically focus next input
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = [...pinDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setPinDigits(newDigits);
    const nextIdx = Math.min(pasted.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullPin = pinDigits.join('');
    if (fullPin.length !== 6) {
      setError('Please enter all 6 numeric digits of your security PIN.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await onConfirm(fullPin);
      if (res && res.error) {
        setError(res.error);
      }
    } catch (err) {
      setError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pin-modal-overlay">
      <div className="pin-modal-card lux-card">
        <div className="pin-modal-header">
          <div className="pin-shield-icon">🛡️</div>
          <h3 className="pin-modal-title">{title}</h3>
          <p className="pin-modal-subtitle">{subtitle}</p>
        </div>

        {amount && (
          <div className="pin-tx-summary">
            <div className="pin-tx-row">
              <span>Authorized Amount:</span>
              <strong className="gold-text">${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            {recipient && (
              <div className="pin-tx-row">
                <span>Beneficiary:</span>
                <strong>{recipient}</strong>
              </div>
            )}
          </div>
        )}

        {!hasPinSet ? (
          <div className="pin-missing-alert">
            <div className="alert-banner alert-error" style={{ marginBottom: '1.25rem' }}>
              <span>⚠ You have not set a 6-digit security PIN for your account yet. Banking operations require an active security PIN for cryptographic authorization.</span>
            </div>
            <button
              type="button"
              className="lux-btn-primary full-width"
              onClick={() => {
                if (onClose) onClose();
                if (onNavigateToSetPin) onNavigateToSetPin();
              }}
            >
              Configure 6-Digit PIN in Profile →
            </button>
            <button
              type="button"
              className="lux-btn-outline full-width"
              style={{ marginTop: '0.75rem' }}
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pin-form">
            <div className="pin-inputs-row" onPaste={handlePaste}>
              {pinDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="pin-digit-input"
                  disabled={loading}
                  autoComplete="off"
                />
              ))}
            </div>

            {error && (
              <div className="alert-banner alert-error" style={{ margin: '1rem 0 0.5rem 0' }}>
                <span>⚠ {error}</span>
              </div>
            )}

            <div className="pin-actions-row">
              <button
                type="button"
                className="lux-btn-outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="lux-btn-primary"
                disabled={loading || pinDigits.join('').length !== 6}
              >
                {loading ? <span className="spinner"></span> : null}
                {loading ? 'Verifying & Clearing...' : 'Authorize Transaction'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default PinPromptModal;
