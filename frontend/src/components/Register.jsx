import { useState } from 'react';
import { API_BASE_URL } from '../config.js';

function Register({ onNavigateToLogin, onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    password: '',
    transactionPin: '',
    confirmTransactionPin: '',
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    type: '', // 'success' | 'error' | ''
    message: '',
    errors: {},
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Restrict PIN fields to numbers and max 6 digits
    if (name === 'transactionPin' || name === 'confirmTransactionPin') {
      const numericVal = value.replace(/\D/g, '').slice(0, 6);
      setFormData((prev) => ({ ...prev, [name]: numericVal }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (feedback.errors && feedback.errors[name]) {
      setFeedback((prev) => ({
        ...prev,
        errors: { ...prev.errors, [name]: null },
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ type: '', message: '', errors: {} });

    // Validate 6-digit PIN
    if (!formData.transactionPin || formData.transactionPin.length !== 6) {
      setFeedback({
        type: 'error',
        message: 'Security PIN must be exactly 6 numeric digits.',
        errors: { transactionPin: 'Must be 6 digits' },
      });
      setLoading(false);
      return;
    }

    if (formData.transactionPin !== formData.confirmTransactionPin) {
      setFeedback({
        type: 'error',
        message: 'Security PIN and confirmation PIN do not match.',
        errors: { confirmTransactionPin: 'PIN confirmation does not match' },
      });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        dateOfBirth: formData.dateOfBirth.trim(),
        address: formData.address.trim(),
        password: formData.password,
        transactionPin: formData.transactionPin,
      };

      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (response.ok && result?.success) {
        setFeedback({
          type: 'success',
          message: 'Account created successfully with encrypted 6-digit Security PIN! Redirecting to Sign In...',
          errors: {},
        });
        const registeredUser = result.data || payload;
        setFormData({
          fullName: '',
          username: '',
          email: '',
          phoneNumber: '',
          dateOfBirth: '',
          address: '',
          password: '',
          transactionPin: '',
          confirmTransactionPin: '',
        });

        if (onRegisterSuccess) {
          setTimeout(() => onRegisterSuccess(registeredUser), 1000);
        }
      } else {
        const errorMsg = result?.message || `Account creation rejected (Status ${response.status})`;
        const validationErrors = result?.errors || {};
        setFeedback({
          type: 'error',
          message: errorMsg,
          errors: validationErrors,
        });
      }
    } catch (err) {
      console.error('Registration error:', err);
      setFeedback({
        type: 'error',
        message: 'Unable to reach account onboarding service. Please verify your connection.',
        errors: {},
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lux-card auth-card register-kyc-card">
      <div className="auth-card-header">
        <div className="view-badge">Client Onboarding</div>
        <h2 className="auth-title">Open Reserve Account</h2>
        <p className="auth-subtitle">
          Complete verified banking registration to receive your unique Account Number, initialize your \$0.00 reserve, and configure your 6-digit cryptographic security PIN.
        </p>
      </div>

      {feedback.message && (
        <div className={`alert-banner ${feedback.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {feedback.type === 'success' ? '✓ ' : '⚠ '}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="lux-form" noValidate>
        {/* Full Name & Username */}
        <div className="form-row-dual">
          <div className="form-group">
            <label htmlFor="reg-fullname">Legal Full Name *</label>
            <input
              id="reg-fullname"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Alexander Stone"
              required
              disabled={loading}
              className={feedback.errors?.fullName ? 'input-error' : ''}
            />
            {feedback.errors?.fullName && (
              <span className="error-text">{feedback.errors.fullName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="reg-username">Client Username *</label>
            <input
              id="reg-username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. alex_stone"
              required
              disabled={loading}
              className={feedback.errors?.username ? 'input-error' : ''}
            />
            {feedback.errors?.username && (
              <span className="error-text">{feedback.errors.username}</span>
            )}
          </div>
        </div>

        {/* Email & Phone */}
        <div className="form-row-dual">
          <div className="form-group">
            <label htmlFor="reg-email">Institutional / Personal Email *</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="alex@nexus.io"
              required
              disabled={loading}
              className={feedback.errors?.email ? 'input-error' : ''}
            />
            {feedback.errors?.email && (
              <span className="error-text">{feedback.errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="reg-phone">Phone Number *</label>
            <input
              id="reg-phone"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+1 (555) 019-2834"
              required
              disabled={loading}
              className={feedback.errors?.phoneNumber ? 'input-error' : ''}
            />
            {feedback.errors?.phoneNumber && (
              <span className="error-text">{feedback.errors.phoneNumber}</span>
            )}
          </div>
        </div>

        {/* DOB & Address */}
        <div className="form-row-dual">
          <div className="form-group">
            <label htmlFor="reg-dob">Date of Birth *</label>
            <input
              id="reg-dob"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              disabled={loading}
              className={feedback.errors?.dateOfBirth ? 'input-error' : ''}
            />
            {feedback.errors?.dateOfBirth && (
              <span className="error-text">{feedback.errors.dateOfBirth}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="reg-address">Residential / Corporate Address *</label>
            <input
              id="reg-address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              placeholder="100 Wall Street, Suite 4200, New York, NY"
              required
              disabled={loading}
              className={feedback.errors?.address ? 'input-error' : ''}
            />
            {feedback.errors?.address && (
              <span className="error-text">{feedback.errors.address}</span>
            )}
          </div>
        </div>

        {/* Master Password */}
        <div className="form-group">
          <label htmlFor="reg-password">Master Security Password * (Min. 6 characters)</label>
          <input
            id="reg-password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create high-entropy master password"
            required
            disabled={loading}
            className={feedback.errors?.password ? 'input-error' : ''}
          />
          {feedback.errors?.password && (
            <span className="error-text">{feedback.errors.password}</span>
          )}
        </div>

        {/* 6-Digit Security PIN Section */}
        <div className="form-row-dual" style={{ background: 'rgba(212, 175, 55, 0.04)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
          <div className="form-group">
            <label htmlFor="reg-pin" style={{ color: 'var(--gold)' }}>
              🔒 6-Digit Security PIN *
            </label>
            <input
              id="reg-pin"
              name="transactionPin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={formData.transactionPin}
              onChange={handleChange}
              placeholder="6 numeric digits"
              required
              disabled={loading}
              className={feedback.errors?.transactionPin ? 'input-error' : ''}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Required to authorize transactions & card actions
            </small>
            {feedback.errors?.transactionPin && (
              <span className="error-text">{feedback.errors.transactionPin}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="reg-pin-confirm" style={{ color: 'var(--gold)' }}>
              🔒 Confirm 6-Digit PIN *
            </label>
            <input
              id="reg-pin-confirm"
              name="confirmTransactionPin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={formData.confirmTransactionPin}
              onChange={handleChange}
              placeholder="Re-enter 6 digits"
              required
              disabled={loading}
              className={feedback.errors?.confirmTransactionPin ? 'input-error' : ''}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {formData.transactionPin && formData.confirmTransactionPin && formData.transactionPin === formData.confirmTransactionPin ? (
                <span style={{ color: 'var(--success)' }}>✓ PINs match</span>
              ) : (
                'Must match the 6-digit PIN above'
              )}
            </small>
            {feedback.errors?.confirmTransactionPin && (
              <span className="error-text">{feedback.errors.confirmTransactionPin}</span>
            )}
          </div>
        </div>

        <button type="submit" className="lux-btn-primary full-width auth-submit-btn" disabled={loading} style={{ marginTop: '1.25rem' }}>
          {loading ? <span className="spinner"></span> : null}
          {loading ? 'Assigning Account & Encrypting Credentials...' : 'Complete Registration & Open Account'}
        </button>
      </form>

      <div className="switch-auth-panel">
        <span>Already hold a Nexus account? </span>
        <button
          type="button"
          className="auth-link-btn"
          onClick={onNavigateToLogin}
          disabled={loading}
        >
          Sign in here
        </button>
      </div>
    </div>
  );
}

export default Register;
