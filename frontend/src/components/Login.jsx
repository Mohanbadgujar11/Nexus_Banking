import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8080';

function Login({ onNavigateToRegister, onLoginSuccess, initialIdentifier = '', registrationMessage = '' }) {
  const [formData, setFormData] = useState({
    identifier: initialIdentifier,
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    type: registrationMessage ? 'success' : '',
    message: registrationMessage || '',
  });

  useEffect(() => {
    if (initialIdentifier) {
      setFormData((prev) => ({ ...prev, identifier: initialIdentifier }));
    }
    if (registrationMessage) {
      setFeedback({ type: 'success', message: registrationMessage });
    }
  }, [initialIdentifier, registrationMessage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (feedback.message) {
      setFeedback({ type: '', message: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ type: '', message: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
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
          message: result.message || 'Authentication successful. Welcome back.',
        });
        if (onLoginSuccess) {
          setTimeout(() => onLoginSuccess(result.data), 400);
        }
      } else {
        const errorMsg = result?.message || `Invalid credentials (Status ${response.status})`;
        setFeedback({
          type: 'error',
          message: errorMsg,
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      setFeedback({
        type: 'error',
        message: 'Could not connect to backend server. Ensure API is running at http://localhost:8080',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lux-card auth-card">
      <div className="auth-card-header">
        <div className="view-badge">Member Gateway</div>
        <h2 className="auth-title">Sign In to Nexus</h2>
        <p className="auth-subtitle">Access your private reserve and core treasury dashboard</p>
      </div>

      {feedback.message && (
        <div className={`alert-banner ${feedback.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {feedback.type === 'success' ? '✓ ' : '⚠ '}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="lux-form" noValidate>
        <div className="form-group">
          <label htmlFor="login-identifier">Username or Verified Email</label>
          <input
            id="login-identifier"
            name="identifier"
            type="text"
            value={formData.identifier}
            onChange={handleChange}
            placeholder="e.g. alex_stone or alex@nexus.io"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="login-password">Master Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your master password"
            required
            disabled={loading}
          />
        </div>

        <button type="submit" className="lux-btn-primary full-width auth-submit-btn" disabled={loading}>
          {loading ? <span className="spinner"></span> : null}
          {loading ? 'Verifying Credentials...' : 'Authenticate & Sign In'}
        </button>
      </form>

      <div className="switch-auth-panel">
        <span>New to Nexus Reserve? </span>
        <button
          type="button"
          className="auth-link-btn"
          onClick={onNavigateToRegister}
          disabled={loading}
        >
          Open an Account
        </button>
      </div>
    </div>
  );
}

export default Login;
