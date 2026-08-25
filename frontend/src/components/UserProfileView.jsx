import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config.js';

function UserProfileView({ user, onUpdateUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'password' | 'pin' | 'settings' | 'contact' | 'report' | 'rating' | 'guidelines' | 'deactivation'
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: '', text: '' });

  // Account / KYC Edit Form
  const [kycData, setKycData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
  });

  // Password Change Form
  const [pwdData, setPwdData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 6-Digit Security PIN Form
  const [pinData, setPinData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
    password: '',
  });

  // Platform & Banking Settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus_user_settings');
      return saved
        ? JSON.parse(saved)
        : {
            sessionTimeout: '15',
            requirePinForCards: true,
            biometricAuth: false,
            instantWireSms: true,
            largeTxThreshold: '1000',
            weeklyStatementDigest: true,
            fraudAlerts: true,
            maskBalanceOnDashboard: false,
            currencySymbol: 'USD',
            routingNetwork: 'FedWire RTGS',
            internationalRemittance: true,
            obsidianTheme: true,
          };
    } catch {
      return {
        sessionTimeout: '15',
        requirePinForCards: true,
        biometricAuth: false,
        instantWireSms: true,
        largeTxThreshold: '1000',
        weeklyStatementDigest: true,
        fraudAlerts: true,
        maskBalanceOnDashboard: false,
        currencySymbol: 'USD',
        routingNetwork: 'FedWire RTGS',
        internationalRemittance: true,
        obsidianTheme: true,
      };
    }
  });

  // Contact Concierge Form
  const [contactMessage, setContactMessage] = useState({
    subject: '',
    message: '',
    priority: 'Standard',
  });

  // Report Problem Form
  const [reportData, setReportData] = useState({
    category: 'Transaction Dispute',
    urgency: 'Normal Priority',
    subject: '',
    details: '',
  });
  const [submittedTickets, setSubmittedTickets] = useState([]);

  // Rating Form
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Deactivation Form
  const [deactData, setDeactData] = useState({
    deactivationType: 'TEMPORARY_FREEZE',
    reason: '',
    password: '',
    acknowledged: false,
  });

  useEffect(() => {
    if (user) {
      setKycData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const showToast = (text, type = 'success') => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 4500);
  };

  // 1. Save KYC Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: kycData.fullName.trim(),
          email: kycData.email.trim(),
          phoneNumber: kycData.phoneNumber.trim(),
          address: kycData.address.trim(),
          role: user.role,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        showToast('Profile information updated successfully.');
        if (onUpdateUser) {
          onUpdateUser(data.data);
        }
      } else {
        showToast(data?.message || 'Failed to update profile details.', 'error');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      showToast('Network error: Unable to reach core profile service.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Change Master Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    if (pwdData.newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }

    if (pwdData.newPassword !== pwdData.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: pwdData.currentPassword,
          newPassword: pwdData.newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        showToast('Master password updated successfully.');
        setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(data?.message || 'Failed to update master password.', 'error');
      }
    } catch (err) {
      console.error('Password change error:', err);
      showToast('Network error: Could not verify security credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Configure / Update 6-Digit Security PIN
  const handleSavePin = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    const cleanedPin = pinData.newPin.replace(/\D/g, '');
    if (cleanedPin.length !== 6) {
      showToast('New security PIN must be exactly 6 numeric digits.', 'error');
      return;
    }

    if (pinData.newPin !== pinData.confirmPin) {
      showToast('New PIN and confirmation PIN do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPin: pinData.currentPin ? pinData.currentPin.trim() : null,
          newPin: cleanedPin,
          password: pinData.password ? pinData.password.trim() : null,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        showToast('6-digit security PIN successfully encrypted and active for all banking operations.');
        setPinData({ currentPin: '', newPin: '', confirmPin: '', password: '' });
        if (onUpdateUser) {
          onUpdateUser({ ...user, hasPinSet: true });
        }
      } else {
        showToast(data?.message || 'Failed to configure security PIN.', 'error');
      }
    } catch (err) {
      console.error('PIN update error:', err);
      showToast('Network error: Could not reach PIN security vault.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 4. Save Banking Settings & Preferences
  const handleSettingToggle = (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      localStorage.setItem('nexus_user_settings', JSON.stringify(updated));
      window.dispatchEvent(new Event('nexus_settings_changed'));
      showToast('Preference saved.');
    } catch (e) {
      console.error('Settings save error:', e);
    }
  };

  // 5. Submit Concierge Message
  const handleSendConcierge = (e) => {
    e.preventDefault();
    if (!contactMessage.subject || !contactMessage.message) {
      showToast('Please provide both a subject and inquiry message.', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Inquiry dispatched to your dedicated Private Reserve Wealth Concierge. Priority SLA: < 15 mins.');
      setContactMessage({ subject: '', message: '', priority: 'Standard' });
    }, 1000);
  };

  // 6. Submit Problem Report
  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!reportData.subject || !reportData.details) {
      showToast('Please fill out the ticket subject and description.', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const ticketId = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
      const newTicket = {
        id: ticketId,
        category: reportData.category,
        subject: reportData.subject,
        urgency: reportData.urgency,
        status: 'UNDER_INVESTIGATION',
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
      setSubmittedTickets([newTicket, ...submittedTickets]);
      setLoading(false);
      showToast(`Dispute ticket ${ticketId} created. Assigned to compliance audit unit.`);
      setReportData({ category: 'Transaction Dispute', urgency: 'Normal Priority', subject: '', details: '' });
    }, 1200);
  };

  // 7. Submit Feedback Rating
  const handleSubmitRating = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setRatingSubmitted(true);
      showToast('Thank you! Your institutional rating has been submitted to executive oversight.');
    }, 900);
  };

  // 8. Submit Deactivation Request
  const handleSubmitDeactivation = async (e) => {
    e.preventDefault();
    if (!deactData.acknowledged) {
      showToast('Please acknowledge the terms before proceeding.', 'error');
      return;
    }
    if (!deactData.password) {
      showToast('Please enter your master password to verify identity.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}/deactivation-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deactivationType: deactData.deactivationType,
          reason: deactData.reason || 'User initiated deactivation request',
          password: deactData.password,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        showToast(
          deactData.deactivationType === 'TEMPORARY_FREEZE'
            ? 'Your account has been temporarily frozen. Contact administration to unfreeze.'
            : 'Permanent closure request dispatched to central compliance administration.'
        );
        if (deactData.deactivationType === 'TEMPORARY_FREEZE') {
          setTimeout(() => {
            if (onLogout) onLogout();
          }, 2500);
        }
      } else {
        showToast(data?.message || 'Deactivation request could not be processed.', 'error');
      }
    } catch (err) {
      console.error('Deactivation error:', err);
      showToast('Network error: Could not reach compliance engine.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const p = pwdData.newPassword;
    if (!p) return { label: 'None', pct: 0, color: 'var(--text-muted)' };
    if (p.length < 6) return { label: 'Too Short', pct: 25, color: 'var(--error)' };
    if (p.length < 8) return { label: 'Moderate', pct: 50, color: '#f59e0b' };
    if (p.length >= 10 && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)) {
      return { label: 'Titanium High-Entropy', pct: 100, color: 'var(--success)' };
    }
    return { label: 'Strong', pct: 75, color: 'var(--gold)' };
  };

  const strength = getPasswordStrength();
  const userInitials = (user?.fullName || user?.username || 'N').substring(0, 2).toUpperCase();

  return (
    <div className="view-container user-profile-container">
      {/* Top Profile Header Card */}
      <div className="lux-card profile-hero-card">
        <div className="profile-hero-inner">
          <div className="profile-avatar-box">
            <span className="profile-avatar-text">{userInitials}</span>
            <span className="profile-status-dot"></span>
          </div>

          <div className="profile-hero-meta">
            <div className="profile-hero-title-row">
              <h2>{user?.fullName || user?.username}</h2>
              <span className="verified-tag">
                {user?.role === 'ROLE_ADMIN' ? 'CENTRAL ADMIN' : 'PRIVATE RESERVE TITANIUM'}
              </span>
            </div>
            <p className="profile-account-sub">
              Unique Reserve Account: <code className="gold-text">{user?.accountNumber || 'NX-PENDING'}</code> • @{user?.username}
            </p>
            <div className="profile-badges-row">
              <span className="badge-committed">✓ KYC Verified</span>
              <span className="badge-committed">
                {user?.hasPinSet ? '🔒 6-Digit PIN Configured' : '⚠ PIN Not Set'}
              </span>
              <span className="badge-committed">🏛 Member FDIC Insured</span>
            </div>
          </div>
        </div>
      </div>

      {toast.text && (
        <div className={`alert-banner ${toast.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {toast.type === 'error' ? '⚠ ' : '✓ '}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Main Profile Layout */}
      <div className="profile-layout-grid">
        {/* Navigation Sidebar Tabs */}
        <div className="lux-card profile-nav-card">
          <nav className="profile-nav-menu">
            <button
              type="button"
              className={`profile-nav-btn ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <span className="p-nav-icon">👤</span>
              <span>Account & KYC Details</span>
            </button>

            <button
              type="button"
              className={`profile-nav-btn ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <span className="p-nav-icon">🔑</span>
              <span>Master Password</span>
            </button>

            <button
              type="button"
              className={`profile-nav-btn ${activeTab === 'pin' ? 'active' : ''}`}
              onClick={() => setActiveTab('pin')}
              style={{ position: 'relative' }}
            >
              <span className="p-nav-icon">🔒</span>
              <span>6-Digit Security PIN</span>
              {!user?.hasPinSet && (
                <span style={{ position: 'absolute', right: '12px', background: 'var(--error)', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px' }}>
                  Action Needed
                </span>
              )}
            </button>

            <button
              type="button"
              className={`profile-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <span className="p-nav-icon">⚙️</span>
              <span>Banking Preferences</span>
            </button>

            <button
              type="button"
              className={`profile-nav-btn ${activeTab === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveTab('contact')}
            >
              <span className="p-nav-icon">📞</span>
              <span>Contact Private Concierge</span>
            </button>

            <button
              type="button"
              className={`profile-nav-btn ${activeTab === 'report' ? 'active' : ''}`}
              onClick={() => setActiveTab('report')}
            >
              <span className="p-nav-icon">⚠</span>
              <span>Report a Dispute</span>
            </button>

            <button
              type="button"
              className={`profile-nav-btn ${activeTab === 'rating' ? 'active' : ''}`}
              onClick={() => setActiveTab('rating')}
            >
              <span className="p-nav-icon">★</span>
              <span>Client Experience Rating</span>
            </button>

            <button
              type="button"
              className={`profile-nav-btn ${activeTab === 'guidelines' ? 'active' : ''}`}
              onClick={() => setActiveTab('guidelines')}
            >
              <span className="p-nav-icon">📜</span>
              <span>Guidelines & Compliance</span>
            </button>

            <button
              type="button"
              className={`profile-nav-btn btn-deact-tab ${activeTab === 'deactivation' ? 'active' : ''}`}
              onClick={() => setActiveTab('deactivation')}
            >
              <span className="p-nav-icon">🔒</span>
              <span>Account Lock & Deactivation</span>
            </button>
          </nav>
        </div>

        {/* Dynamic Content Panel */}
        <div className="profile-content-column">
          {/* TAB 1: ACCOUNT & KYC DETAILS */}
          {activeTab === 'account' && (
            <div className="lux-card">
              <div className="lux-card-header">
                <div>
                  <h3>Client Identity & KYC Record</h3>
                  <p>Certified personal information and routing coordinates</p>
                </div>
                <span className="badge-committed">Active Status</span>
              </div>

              {/* Read-Only Essential Banking Information */}
              <div className="profile-essentials-grid">
                <div className="p-ess-item">
                  <span className="p-ess-label">ACCOUNT NUMBER</span>
                  <code className="p-ess-value gold-text">{user?.accountNumber || 'NX-PENDING'}</code>
                </div>
                <div className="p-ess-item">
                  <span className="p-ess-label">FEDWIRE ROUTING NUMBER</span>
                  <code className="p-ess-value">021000089</code>
                </div>
                <div className="p-ess-item">
                  <span className="p-ess-label">SWIFT / BIC CODE</span>
                  <code className="p-ess-value">NXUSUS33NYC</code>
                </div>
                <div className="p-ess-item">
                  <span className="p-ess-label">DATE OF BIRTH</span>
                  <span className="p-ess-value">{user?.dateOfBirth || 'Verified'}</span>
                </div>
              </div>

              {/* Editable Personal Details Form */}
              <form onSubmit={handleSaveProfile} className="lux-form profile-form">
                <h4 className="form-section-title">Editable Contact Details</h4>

                <div className="form-row-dual">
                  <div className="form-group">
                    <label htmlFor="pf-fullname">Legal Full Name *</label>
                    <input
                      id="pf-fullname"
                      type="text"
                      value={kycData.fullName}
                      onChange={(e) => setKycData({ ...kycData, fullName: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="pf-username">Username (Permanent Core Identifier)</label>
                    <input
                      id="pf-username"
                      type="text"
                      value={user?.username || ''}
                      disabled
                      className="input-disabled"
                    />
                  </div>
                </div>

                <div className="form-row-dual">
                  <div className="form-group">
                    <label htmlFor="pf-email">Institutional Email *</label>
                    <input
                      id="pf-email"
                      type="email"
                      value={kycData.email}
                      onChange={(e) => setKycData({ ...kycData, email: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="pf-phone">Primary Phone Number *</label>
                    <input
                      id="pf-phone"
                      type="tel"
                      value={kycData.phoneNumber}
                      onChange={(e) => setKycData({ ...kycData, phoneNumber: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="pf-address">Residential / Corporate Address *</label>
                  <input
                    id="pf-address"
                    type="text"
                    value={kycData.address}
                    onChange={(e) => setKycData({ ...kycData, address: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <button type="submit" className="lux-btn-primary" disabled={loading}>
                  {loading ? 'Saving to Core...' : 'Save Profile Details'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: MASTER PASSWORD & SECURITY */}
          {activeTab === 'password' && (
            <div className="lux-card">
              <div className="lux-card-header">
                <div>
                  <h3>Master Password Credentials</h3>
                  <p>Manage your high-entropy account password for master portal access.</p>
                </div>
                <span className="badge-committed">Argon2 / BCrypt Encrypted</span>
              </div>

              <form onSubmit={handleChangePassword} className="lux-form profile-form">
                <div className="form-group">
                  <label htmlFor="curr-pwd">Current Master Password *</label>
                  <input
                    id="curr-pwd"
                    type="password"
                    placeholder="Enter current master password"
                    value={pwdData.currentPassword}
                    onChange={(e) => setPwdData({ ...pwdData, currentPassword: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new-pwd">New Master Password *</label>
                  <input
                    id="new-pwd"
                    type="password"
                    placeholder="Min. 6 characters, recommend uppercase & numbers"
                    value={pwdData.newPassword}
                    onChange={(e) => setPwdData({ ...pwdData, newPassword: e.target.value })}
                    required
                    disabled={loading}
                  />

                  {pwdData.newPassword && (
                    <div className="password-meter-wrap">
                      <div className="meter-bar-bg">
                        <div
                          className="meter-bar-fill"
                          style={{ width: `${strength.pct}%`, backgroundColor: strength.color }}
                        ></div>
                      </div>
                      <span className="meter-label" style={{ color: strength.color }}>
                        Strength: {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-pwd">Confirm New Master Password *</label>
                  <input
                    id="confirm-pwd"
                    type="password"
                    placeholder="Re-enter new master password"
                    value={pwdData.confirmPassword}
                    onChange={(e) => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <button type="submit" className="lux-btn-primary" disabled={loading}>
                  {loading ? 'Re-encrypting Password...' : 'Update Master Password'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: 6-DIGIT SECURITY PIN MANAGEMENT */}
          {activeTab === 'pin' && (
            <div className="lux-card">
              <div className="lux-card-header">
                <div>
                  <h3>6-Digit Security Transaction PIN</h3>
                  <p>Your cryptographic PIN is required to authorize outbound wire transfers, card actions, and vault deposits.</p>
                </div>
                <span className={`badge-committed ${user?.hasPinSet ? '' : 'alert-badge-err'}`}>
                  {user?.hasPinSet ? '✓ PIN Active' : '⚠ PIN Not Configured'}
                </span>
              </div>

              <div className="pin-overview-card" style={{ background: 'rgba(212, 175, 55, 0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.2)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>🛡️</div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--gold)' }}>
                      {user?.hasPinSet ? 'Your 6-Digit PIN is Active' : 'Setup Your 6-Digit PIN'}
                    </h4>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      All transfers and card operations require this 6-digit PIN. Never share your PIN with anyone.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSavePin} className="lux-form profile-form">
                {user?.hasPinSet ? (
                  <div className="form-group">
                    <label htmlFor="pf-curr-pin">Current 6-Digit PIN (or Master Password) *</label>
                    <input
                      id="pf-curr-pin"
                      type="password"
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="Enter current 6-digit PIN"
                      value={pinData.currentPin}
                      onChange={(e) => setPinData({ ...pinData, currentPin: e.target.value.replace(/\D/g, '') })}
                      disabled={loading}
                    />
                    <small style={{ color: 'var(--text-muted)' }}>
                      Alternatively, enter master password below if you forgot your current PIN
                    </small>
                  </div>
                ) : (
                  <div className="form-group">
                    <label htmlFor="pf-auth-pwd">Confirm Master Password *</label>
                    <input
                      id="pf-auth-pwd"
                      type="password"
                      placeholder="Enter master password to initialize PIN"
                      value={pinData.password}
                      onChange={(e) => setPinData({ ...pinData, password: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                )}

                <div className="form-row-dual">
                  <div className="form-group">
                    <label htmlFor="pf-new-pin" style={{ color: 'var(--gold)' }}>
                      New 6-Digit Security PIN *
                    </label>
                    <input
                      id="pf-new-pin"
                      type="password"
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="6 numeric digits"
                      value={pinData.newPin}
                      onChange={(e) => setPinData({ ...pinData, newPin: e.target.value.replace(/\D/g, '') })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="pf-conf-pin" style={{ color: 'var(--gold)' }}>
                      Confirm 6-Digit PIN *
                    </label>
                    <input
                      id="pf-conf-pin"
                      type="password"
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="Re-enter 6 digits"
                      value={pinData.confirmPin}
                      onChange={(e) => setPinData({ ...pinData, confirmPin: e.target.value.replace(/\D/g, '') })}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {pinData.newPin && pinData.confirmPin && pinData.newPin === pinData.confirmPin && (
                  <div style={{ color: 'var(--success)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    ✓ 6-Digit PIN confirmation matches
                  </div>
                )}

                <button type="submit" className="lux-btn-primary" disabled={loading || pinData.newPin.length !== 6}>
                  {loading ? 'Encrypting & Saving PIN...' : user?.hasPinSet ? 'Update 6-Digit PIN' : 'Activate 6-Digit Security PIN'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: BANKING PREFERENCES & PLATFORM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="lux-card">
              <div className="lux-card-header">
                <div>
                  <h3>Platform & Banking Settings</h3>
                  <p>Customize security parameters, alert thresholds, privacy masks, and routing options.</p>
                </div>
                <span className="badge-committed">Enterprise Client Controls</span>
              </div>

              <div className="settings-section-list">
                {/* 1. Transactional Security */}
                <div className="settings-group-card" style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h4 style={{ color: 'var(--gold)', margin: '0 0 1rem 0' }}>🔒 Transactional Security & Session Controls</h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <strong>Auto-Lock Inactivity Timeout</strong>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Automatically lock session when inactive</p>
                    </div>
                    <select
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingToggle('sessionTimeout', e.target.value)}
                      style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '6px' }}
                    >
                      <option value="5">5 Minutes</option>
                      <option value="15">15 Minutes (Default)</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">1 Hour</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <strong>Require 6-Digit PIN on Card Freeze/Unfreeze</strong>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Mandates PIN check before altering card states</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.requirePinForCards}
                      onChange={(e) => handleSettingToggle('requirePinForCards', e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--gold)', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>Biometric & WebAuthn Fast Sign-off</strong>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Use TouchID / Windows Hello for rapid authorizations</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.biometricAuth}
                      onChange={(e) => handleSettingToggle('biometricAuth', e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--gold)', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                {/* 2. Notifications & Alerts */}
                <div className="settings-group-card" style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h4 style={{ color: 'var(--gold)', margin: '0 0 1rem 0' }}>🔔 Real-Time Notifications & Auditing</h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <strong>Instant Outbound Wire SMS Alerts</strong>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>SMS notification dispatched upon any debit clearing</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.instantWireSms}
                      onChange={(e) => handleSettingToggle('instantWireSms', e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--gold)', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <strong>High-Value Transaction Alert Threshold</strong>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Send immediate push alerts for single debits over threshold</p>
                    </div>
                    <select
                      value={settings.largeTxThreshold}
                      onChange={(e) => handleSettingToggle('largeTxThreshold', e.target.value)}
                      style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '6px' }}
                    >
                      <option value="500">$500.00</option>
                      <option value="1000">$1,000.00 (Standard)</option>
                      <option value="5000">$5,000.00</option>
                      <option value="10000">$10,000.00 (Private Reserve)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>Weekly Reserve Statements & Audit Digest</strong>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Weekly automated PDF reconciliation report delivery</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.weeklyStatementDigest}
                      onChange={(e) => handleSettingToggle('weeklyStatementDigest', e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--gold)', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                {/* 3. Display & Privacy */}
                <div className="settings-group-card" style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h4 style={{ color: 'var(--gold)', margin: '0 0 1rem 0' }}>👁️ Privacy Mode & Display Localization</h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <strong>Mask Account Balance by Default (Privacy Shield)</strong>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Obfuscates total reserve balance on dashboard until revealed</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.maskBalanceOnDashboard}
                      onChange={(e) => handleSettingToggle('maskBalanceOnDashboard', e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--gold)', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <strong>Primary Currency Display Symbol</strong>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Default formatting for balance and ledger figures</p>
                    </div>
                    <select
                      value={settings.currencySymbol}
                      onChange={(e) => handleSettingToggle('currencySymbol', e.target.value)}
                      style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '6px' }}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="CHF">CHF (Fr.)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>Default Wire Routing Network</strong>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Preferred capital movement rails</p>
                    </div>
                    <select
                      value={settings.routingNetwork}
                      onChange={(e) => handleSettingToggle('routingNetwork', e.target.value)}
                      style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '6px' }}
                    >
                      <option value="FedWire RTGS">FedWire RTGS (Real-Time Gross)</option>
                      <option value="SWIFT GPI">SWIFT GPI (Global)</option>
                      <option value="Nexus Internal">Nexus Internal Core (Zero-Fee)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CONTACT PRIVATE CONCIERGE */}
          {activeTab === 'contact' && (
            <div className="lux-card">
              <div className="lux-card-header">
                <div>
                  <h3>Private Concierge & Wealth Desk</h3>
                  <p>Direct priority line to your dedicated institutional relationship manager.</p>
                </div>
                <span className="badge-committed">24/7 Available</span>
              </div>

              <div className="concierge-contact-grid">
                <div className="concierge-card-item">
                  <span className="c-icon">📞</span>
                  <strong>Private Hotline</strong>
                  <code>+1 (800) 840-NEXUS</code>
                  <small>Priority Direct Extension 402</small>
                </div>
                <div className="concierge-card-item">
                  <span className="c-icon">✉</span>
                  <strong>Executive Desk</strong>
                  <code>concierge@nexus.io</code>
                  <small>Encrypted PGP Available</small>
                </div>
                <div className="concierge-card-item">
                  <span className="c-icon">🏛</span>
                  <strong>Physical Headquarters</strong>
                  <span>100 Wall Street, 42nd Fl</span>
                  <small>New York, NY 10005</small>
                </div>
              </div>

              <form onSubmit={handleSendConcierge} className="lux-form profile-form">
                <h4 className="form-section-title">Dispatch Direct Instruction</h4>

                <div className="form-row-dual">
                  <div className="form-group">
                    <label htmlFor="c-subject">Subject / Inquiry Type *</label>
                    <input
                      id="c-subject"
                      type="text"
                      placeholder="e.g. Outbound Cross-Border Escrow Approval"
                      value={contactMessage.subject}
                      onChange={(e) => setContactMessage({ ...contactMessage, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="c-priority">Priority SLA *</label>
                    <select
                      id="c-priority"
                      value={contactMessage.priority}
                      onChange={(e) => setContactMessage({ ...contactMessage, priority: e.target.value })}
                    >
                      <option value="Standard">Standard (Within 2 Hours)</option>
                      <option value="High Priority">High Priority (Within 30 Mins)</option>
                      <option value="Emergency Escrow">Emergency Escrow / Wire Hold (Immediate)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="c-msg">Instruction Details *</label>
                  <textarea
                    id="c-msg"
                    rows="4"
                    placeholder="Specify the details of your wealth request or required documentation..."
                    value={contactMessage.message}
                    onChange={(e) => setContactMessage({ ...contactMessage, message: e.target.value })}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="lux-btn-primary" disabled={loading}>
                  {loading ? 'Transmitting Securely...' : 'Transmit Instruction to Concierge'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 6: DISPUTE & PROBLEM RESOLUTION */}
          {activeTab === 'report' && (
            <div className="lux-card">
              <div className="lux-card-header">
                <div>
                  <h3>Dispute Resolution & Transaction Investigation</h3>
                  <p>Initiate formal transactional investigations or report security discrepancies.</p>
                </div>
                <span className="badge-committed">Compliance Protected</span>
              </div>

              <form onSubmit={handleSubmitReport} className="lux-form profile-form">
                <div className="form-row-dual">
                  <div className="form-group">
                    <label htmlFor="rep-cat">Dispute Category *</label>
                    <select
                      id="rep-cat"
                      value={reportData.category}
                      onChange={(e) => setReportData({ ...reportData, category: e.target.value })}
                    >
                      <option value="Transaction Dispute">Unrecognized Outbound Transaction</option>
                      <option value="Card Fraud">Card Unauthorized Charge</option>
                      <option value="SWIFT Clearance Delay">SWIFT / Wire Clearance Delay</option>
                      <option value="Security Anomaly">Portal Security / IP Anomaly</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="rep-urgency">Urgency Level *</label>
                    <select
                      id="rep-urgency"
                      value={reportData.urgency}
                      onChange={(e) => setReportData({ ...reportData, urgency: e.target.value })}
                    >
                      <option value="Normal Priority">Normal (24-Hour Review)</option>
                      <option value="High Priority">High Priority (4-Hour Response)</option>
                      <option value="Critical Fraud">Critical (Immediate Account Hold)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="rep-subject">Ticket Subject / Reference Number *</label>
                  <input
                    id="rep-subject"
                    type="text"
                    placeholder="e.g. Dispute for TX-82910482 on Aug 20"
                    value={reportData.subject}
                    onChange={(e) => setReportData({ ...reportData, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="rep-details">Comprehensive Description *</label>
                  <textarea
                    id="rep-details"
                    rows="4"
                    placeholder="Provide timestamps, merchant names, amounts, or discrepancy details..."
                    value={reportData.details}
                    onChange={(e) => setReportData({ ...reportData, details: e.target.value })}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="lux-btn-primary" disabled={loading}>
                  {loading ? 'Filing Investigation Ticket...' : 'File Formal Dispute Ticket'}
                </button>
              </form>

              {submittedTickets.length > 0 && (
                <div className="submitted-tickets-box">
                  <h4>Active Investigation Tickets ({submittedTickets.length})</h4>
                  <div className="ticket-list">
                    {submittedTickets.map((t) => (
                      <div key={t.id} className="ticket-item">
                        <div className="ticket-header">
                          <code className="gold-text">{t.id}</code>
                          <span className="badge-committed">{t.status}</span>
                        </div>
                        <p className="ticket-subject">{t.subject}</p>
                        <div className="ticket-meta">
                          <span>{t.category}</span> • <span>{t.urgency}</span> • <span>Filed {t.createdAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: CLIENT EXPERIENCE RATING */}
          {activeTab === 'rating' && (
            <div className="lux-card">
              <div className="lux-card-header">
                <div>
                  <h3>Institutional Client Experience</h3>
                  <p>Provide executive feedback regarding our core banking latency, security, and concierge services.</p>
                </div>
                <span className="badge-committed">Executive Oversight</span>
              </div>

              {ratingSubmitted ? (
                <div className="rating-success-box">
                  <span className="big-check">✓</span>
                  <h3>Thank you for your rating!</h3>
                  <p>Your feedback is audited by the Nexus Executive Banking Committee to drive continuous quality enhancements.</p>
                  <button
                    type="button"
                    className="lux-btn-outline"
                    onClick={() => setRatingSubmitted(false)}
                  >
                    Submit Another Review
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitRating} className="lux-form profile-form">
                  <div className="form-group star-rating-group">
                    <label>Overall Banking Experience</label>
                    <div className="stars-row">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star-btn ${(hoverRating || rating) >= star ? 'star-filled' : ''}`}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                        >
                          ★
                        </button>
                      ))}
                      <span className="star-rating-text">
                        {rating === 5 && 'Exceptional (Private Reserve Tier)'}
                        {rating === 4 && 'Very Good (Institutional Grade)'}
                        {rating === 3 && 'Average'}
                        {rating === 2 && 'Needs Improvement'}
                        {rating === 1 && 'Unsatisfactory'}
                      </span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="rating-comment">Detailed Feedback / Feature Requests</label>
                    <textarea
                      id="rating-comment"
                      rows="4"
                      placeholder="Share your thoughts on transfer execution speed, card controls, or portal interface..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                    ></textarea>
                  </div>

                  <button type="submit" className="lux-btn-primary" disabled={loading}>
                    {loading ? 'Submitting Evaluation...' : 'Submit Institutional Rating'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 8: GUIDELINES & COMPLIANCE */}
          {activeTab === 'guidelines' && (
            <div className="lux-card">
              <div className="lux-card-header">
                <div>
                  <h3>Institutional Guidelines & Regulatory Framework</h3>
                  <p>Federal deposit insurance rules, settlement clearing policies, and compliance terms.</p>
                </div>
                <span className="badge-committed">FDIC & OCC Regulated</span>
              </div>

              <div className="guidelines-accordion">
                <div className="guideline-item">
                  <h4>1. FDIC Insurance & Reserve Backing</h4>
                  <p>
                    All deposits held in Nexus Core checking and vault reserves are insured by the Federal Deposit Insurance Corporation (FDIC) up to \$250,000 per depositor for individual accounts, with extended coverage up to \$25,000,000 through the IntraFi reciprocal deposit network.
                  </p>
                </div>

                <div className="guideline-item">
                  <h4>2. Real-Time Settlement & Clearing (RTGS)</h4>
                  <p>
                    Outbound domestic wire transfers dispatched via the FedWire RTGS channel settle atomically within 15 seconds during Federal Reserve operational hours. SWIFT GPI transfers require 1–3 hours for cross-border beneficiary clearance.
                  </p>
                </div>

                <div className="guideline-item">
                  <h4>3. 6-Digit Cryptographic PIN Protocol</h4>
                  <p>
                    In accordance with FIPS 140-2 Level 4 banking standards, all high-value capital dispatches and card authorizations require the client's 6-digit cryptographic PIN. The PIN is hashed client-side with BCrypt salting and is never stored in plain text.
                  </p>
                </div>

                <div className="guideline-item">
                  <h4>4. Anti-Money Laundering (AML) & OFAC Screening</h4>
                  <p>
                    All transactions executed on Nexus Core are evaluated in real time against global sanctions lists, including OFAC, UN Security Council, and EU restrictive measures using zero-knowledge cryptographic heuristics.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: ACCOUNT LOCK & DEACTIVATION */}
          {activeTab === 'deactivation' && (
            <div className="lux-card deact-card">
              <div className="lux-card-header">
                <div>
                  <h3 className="danger-title">Account Security Freeze & Deactivation</h3>
                  <p>Place an emergency freeze on your account or request permanent regulatory closure.</p>
                </div>
                <span className="badge-committed alert-badge-err">High Security Action</span>
              </div>

              <form onSubmit={handleSubmitDeactivation} className="lux-form profile-form">
                <div className="form-group">
                  <label>Select Action Type *</label>
                  <div className="deact-type-selector">
                    <label className={`deact-type-option ${deactData.deactivationType === 'TEMPORARY_FREEZE' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="deactType"
                        value="TEMPORARY_FREEZE"
                        checked={deactData.deactivationType === 'TEMPORARY_FREEZE'}
                        onChange={(e) => setDeactData({ ...deactData, deactivationType: e.target.value })}
                      />
                      <div>
                        <strong>🔒 Temporary Account Freeze</strong>
                        <span>Instantly locks card transactions, outbound transfers, and login access. Can be unfrozen by administrator.</span>
                      </div>
                    </label>

                    <label className={`deact-type-option ${deactData.deactivationType === 'PERMANENT_CLOSURE' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="deactType"
                        value="PERMANENT_CLOSURE"
                        checked={deactData.deactivationType === 'PERMANENT_CLOSURE'}
                        onChange={(e) => setDeactData({ ...deactData, deactivationType: e.target.value })}
                      />
                      <div>
                        <strong>✕ Permanent Account Closure Request</strong>
                        <span>Dispatches a formal closure request to central bank compliance for final statement settlement.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="deact-reason">Reason for Freeze / Closure</label>
                  <textarea
                    id="deact-reason"
                    rows="3"
                    placeholder="Provide context for our compliance administrators..."
                    value={deactData.reason}
                    onChange={(e) => setDeactData({ ...deactData, reason: e.target.value })}
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="deact-pwd">Confirm Master Password *</label>
                  <input
                    id="deact-pwd"
                    type="password"
                    placeholder="Enter your master password"
                    value={deactData.password}
                    onChange={(e) => setDeactData({ ...deactData, password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={deactData.acknowledged}
                      onChange={(e) => setDeactData({ ...deactData, acknowledged: e.target.checked })}
                    />
                    <span>
                      I understand that submitting this request will lock access to my Nexus Reserve account and require administrator verification to reactivate.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="lux-btn-primary btn-danger full-width"
                  disabled={loading || !deactData.acknowledged}
                >
                  {loading ? 'Submitting Request...' : deactData.deactivationType === 'TEMPORARY_FREEZE' ? 'Freeze My Account Instantly' : 'Submit Permanent Closure Request'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfileView;
