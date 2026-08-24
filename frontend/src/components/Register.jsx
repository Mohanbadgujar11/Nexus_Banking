import { useState } from 'react';

const API_BASE_URL = 'http://localhost:8080';

function Register({ onNavigateToLogin, onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    password: '',
    role: 'ROLE_USER',
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    type: '', // 'success' | 'error' | ''
    message: '',
    errors: {},
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json().catch(() => null);

      if (response.ok && result?.success) {
        setFeedback({
          type: 'success',
          message: 'Account created successfully! Unique Account Number assigned. Redirecting to Sign In...',
          errors: {},
        });
        const registeredUser = result.data || formData;
        setFormData({
          fullName: '',
          username: '',
          email: '',
          phoneNumber: '',
          dateOfBirth: '',
          address: '',
          password: '',
          role: 'ROLE_USER',
        });

        // Transition to login screen so the user enters credentials to verify
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
        <div className="view-badge">New Client Onboarding</div>
        <h2 className="auth-title">Open Reserve Account</h2>
        <p className="auth-subtitle">
          Complete verified banking registration to receive your unique Account Number and initialize a \$0.00 reserve.
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
            <label htmlFor="reg-email">Institutional Email *</label>
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

        {/* DOB & Account Role */}
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
            <label htmlFor="reg-role">Account Type & Role *</label>
            <select
              id="reg-role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="ROLE_USER">Individual Client (Standard Reserve)</option>
              <option value="ROLE_ADMIN">Banking Administrator (Admin Console)</option>
            </select>
          </div>
        </div>

        {/* Address */}
        <div className="form-group">
          <label htmlFor="reg-address">Residential / Corporate Address *</label>
          <input
            id="reg-address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleChange}
            placeholder="100 Wall Street, Suite 4200, New York, NY 10005"
            required
            disabled={loading}
            className={feedback.errors?.address ? 'input-error' : ''}
          />
          {feedback.errors?.address && (
            <span className="error-text">{feedback.errors.address}</span>
          )}
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

        <button type="submit" className="lux-btn-primary full-width auth-submit-btn" disabled={loading}>
          {loading ? <span className="spinner"></span> : null}
          {loading ? 'Assigning Account Number & Provisioning...' : 'Complete Registration & Open Account'}
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
