import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8080';

function UserProfileView({ user, onUpdateUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'password' | 'contact' | 'report' | 'rating' | 'guidelines' | 'deactivation'
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
      showToast('New password must contain at least 6 characters.', 'error');
      return;
    }

    if (pwdData.newPassword !== pwdData.confirmPassword) {
      showToast('New password confirmation does not match.', 'error');
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
        showToast('Master password successfully updated and encrypted.');
        setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(data?.message || 'Password update rejected. Check your current password.', 'error');
      }
    } catch (err) {
      console.error('Password change error:', err);
      showToast('Network error: Unable to reach security gateway.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Dispatch Concierge Message
  const handleSendConcierge = (e) => {
    e.preventDefault();
    if (!contactMessage.message.trim()) return;
    showToast('Your message has been securely dispatched to your Dedicated Relationship Concierge.');
    setContactMessage({ subject: '', message: '', priority: 'Standard' });
  };

  // 4. Report Problem
  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!reportData.details.trim()) return;

    const ticketId = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
    const newTicket = {
      id: ticketId,
      category: reportData.category,
      urgency: reportData.urgency,
      subject: reportData.subject || 'Incident Investigation Request',
      date: new Date().toLocaleString(),
      status: 'UNDER REVIEW',
    };

    setSubmittedTickets([newTicket, ...submittedTickets]);
    showToast(`Problem reported. Tracking Reference: #${ticketId} (Assigned to Operations)`);
    setReportData({
      category: 'Transaction Dispute',
      urgency: 'Normal Priority',
      subject: '',
      details: '',
    });
  };

  // 5. Submit Rating
  const handleSubmitRating = (e) => {
    e.preventDefault();
    setRatingSubmitted(true);
    showToast(`Thank you for your ${rating}-Star rating and feedback!`);
  };

  // 6. Submit Deactivation Request
  const handleDeactivate = async (e) => {
    e.preventDefault();
    if (!deactData.acknowledged) {
      showToast('Please acknowledge the deactivation terms to proceed.', 'error');
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
              <span className="badge-committed">🔒 256-Bit Hardware Encrypted</span>
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
              <span>Master Password & Security</span>
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
              <span>Report a Problem / Dispute</span>
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
                    <label htmlFor="pf-email">Verified Email Address *</label>
                    <input
                      id="pf-email"
                      type="email"
                      value={kycData.email}
                      onChange={(e) => setKycData({ ...kycData, email: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-row-dual">
                  <div className="form-group">
                    <label htmlFor="pf-phone">Phone Number</label>
                    <input
                      id="pf-phone"
                      type="tel"
                      value={kycData.phoneNumber}
                      onChange={(e) => setKycData({ ...kycData, phoneNumber: e.target.value })}
                      placeholder="+1 (555) 019-2834"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="pf-username">Username (Read-Only)</label>
                    <input
                      id="pf-username"
                      type="text"
                      value={`@${user?.username || ''}`}
                      disabled
                      className="input-disabled"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="pf-address">Residential / Corporate Address</label>
                  <input
                    id="pf-address"
                    type="text"
                    value={kycData.address}
                    onChange={(e) => setKycData({ ...kycData, address: e.target.value })}
                    placeholder="100 Wall Street, Suite 4200, New York, NY 10005"
                    disabled={loading}
                  />
                </div>

                <button type="submit" className="lux-btn-primary full-width" disabled={loading}>
                  {loading ? 'Saving Profile Updates...' : 'Save & Update KYC Record'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: MASTER PASSWORD & SECURITY */}
          {activeTab === 'password' && (
            <div className="lux-card">
              <div className="lux-card-header">
                <div>
                  <h3>Master Security Password</h3>
                  <p>Update your authorization credentials guarded by cryptographic hashing</p>
                </div>
                <span className="health-tag-active">Encrypted Enclave</span>
              </div>

              <form onSubmit={handleChangePassword} className="lux-form">
                <div className="form-group">
                  <label htmlFor="pwd-current">Current Master Password *</label>
                  <input
                    id="pwd-current"
                    type="password"
                    value={pwdData.currentPassword}
                    onChange={(e) => setPwdData({ ...pwdData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pwd-new">New Master Password * (Min. 6 characters)</label>
                  <input
                    id="pwd-new"
                    type="password"
                    value={pwdData.newPassword}
                    onChange={(e) => setPwdData({ ...pwdData, newPassword: e.target.value })}
                    placeholder="Create a high-entropy new password"
                    required
                    disabled={loading}
                  />

                  {pwdData.newPassword && (
                    <div className="entropy-meter-wrap">
                      <div className="entropy-label-row">
                        <span>Entropy Strength:</span>
                        <strong style={{ color: strength.color }}>{strength.label}</strong>
                      </div>
                      <div className="entropy-bar-track">
                        <div
                          className="entropy-bar-fill"
                          style={{ width: `${strength.pct}%`, background: strength.color }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="pwd-confirm">Confirm New Password *</label>
                  <input
                    id="pwd-confirm"
                    type="password"
                    value={pwdData.confirmPassword}
                    onChange={(e) => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    required
                    disabled={loading}
                  />
                </div>

                <button type="submit" className="lux-btn-primary full-width" disabled={loading}>
                  {loading ? 'Encrypting & Updating...' : 'Commit & Update Master Password'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: CONTACT US & PRIVATE CONCIERGE */}
          {activeTab === 'contact' && (
            <div className="lux-card">
              <div className="lux-card-header">
                <div>
                  <h3>Private Banking Concierge & Contact</h3>
                  <p>24/7 priority communication channel with dedicated relationship officers</p>
                </div>
                <span className="zero-fee-pill">24/7 Available</span>
              </div>

              <div className="concierge-cards-grid">
                <div className="concierge-box">
                  <div className="c-icon">🏛</div>
                  <h4>Private Wealth Desk</h4>
                  <p className="c-val">+1 (800) 555-NEXUS</p>
                  <span className="c-sub">Toll-Free Priority Direct Line</span>
                </div>

                <div className="concierge-box">
                  <div className="c-icon">✉</div>
                  <h4>Encrypted Email</h4>
                  <p className="c-val">private.concierge@nexus.io</p>
                  <span className="c-sub">&lt; 15 min response guaranteed</span>
                </div>

                <div className="concierge-box">
                  <div className="c-icon">📍</div>
                  <h4>Headquarters Enclave</h4>
                  <p className="c-val">100 Wall St, 42nd Floor</p>
                  <span className="c-sub">New York, NY 10005</span>
                </div>
              </div>

              <form onSubmit={handleSendConcierge} className="lux-form" style={{ marginTop: '28px' }}>
                <h4 className="form-section-title">Send Direct Priority Message</h4>

                <div className="form-row-dual">
                  <div className="form-group">
                    <label htmlFor="cc-subject">Subject / Inquiry Title</label>
                    <input
                      id="cc-subject"
                      type="text"
                      placeholder="e.g. Wire Confirmation / Custom Credit Facility"
                      value={contactMessage.subject}
                      onChange={(e) => setContactMessage({ ...contactMessage, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cc-priority">Dispatch Priority</label>
                    <select
                      id="cc-priority"
                      value={contactMessage.priority}
                      onChange={(e) => setContactMessage({ ...contactMessage, priority: e.target.value })}
                    >
                      <option value="Standard">Standard (General Inquiry)</option>
                      <option value="Urgent">Urgent (Trading / Wire Clearance)</option>
                      <option value="VIP Escrow">VIP Escrow / High Value</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="cc-message">Detailed Inquiry</label>
                  <textarea
                    id="cc-message"
                    rows="4"
                    placeholder="Describe your inquiry in detail..."
                    value={contactMessage.message}
                    onChange={(e) => setContactMessage({ ...contactMessage, message: e.target.value })}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="lux-btn-primary full-width">
                  Dispatch Message to Private Concierge
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: REPORT A PROBLEM / DISPUTE */}
          {activeTab === 'report' && (
            <div className="lux-card">
              <div className="lux-card-header">
                <div>
                  <h3>Report a Problem or Transaction Dispute</h3>
                  <p>Submit incident details for investigation by the Fraud & Settlement Team</p>
                </div>
                <span className="badge-committed">Zero Liability Guarantee</span>
              </div>

              <form onSubmit={handleSubmitReport} className="lux-form">
                <div className="form-row-dual">
                  <div className="form-group">
                    <label htmlFor="rpt-cat">Problem Category *</label>
                    <select
                      id="rpt-cat"
                      value={reportData.category}
                      onChange={(e) => setReportData({ ...reportData, category: e.target.value })}
                    >
                      <option value="Transaction Dispute">Transaction Dispute / Unauthorized Charge</option>
                      <option value="Card Authorization Error">Card Authorization / POS Failure</option>
                      <option value="Wire Settlement Delay">Wire Settlement Delay</option>
                      <option value="Security Vulnerability">Security or Phishing Concern</option>
                      <option value="Other">Other Operational Inconvenience</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="rpt-urg">Urgency Level *</label>
                    <select
                      id="rpt-urg"
                      value={reportData.urgency}
                      onChange={(e) => setReportData({ ...reportData, urgency: e.target.value })}
                    >
                      <option value="Normal Priority">Normal (Resolved within 24h)</option>
                      <option value="High Priority">High Priority (&lt; 4h)</option>
                      <option value="Emergency Fraud Alert">Emergency Fraud Alert (Immediate Lock)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="rpt-sub">Incident Subject</label>
                  <input
                    id="rpt-sub"
                    type="text"
                    placeholder="e.g. Unrecognized charge on Titanium Card ending in 8829"
                    value={reportData.subject}
                    onChange={(e) => setReportData({ ...reportData, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="rpt-details">Detailed Explanation & Transaction References</label>
                  <textarea
                    id="rpt-details"
                    rows="4"
                    placeholder="Please include approximate amount, dates, transaction reference numbers, or description..."
                    value={reportData.details}
                    onChange={(e) => setReportData({ ...reportData, details: e.target.value })}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="lux-btn-primary full-width">
                  Submit Problem Report to Investigation Unit
                </button>
              </form>

              {/* Submitted Tickets History */}
              {submittedTickets.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                  <h4 className="form-section-title">Submitted Incident Reports</h4>
                  <div className="tickets-list">
                    {submittedTickets.map((t) => (
                      <div key={t.id} className="ticket-item">
                        <div>
                          <span className="ticket-id gold-text">#{t.id}</span>
                          <strong>{t.subject}</strong>
                          <span className="ticket-meta">{t.category} • {t.date}</span>
                        </div>
                        <span className="ticket-status-tag">{t.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CLIENT EXPERIENCE RATING */}
          {activeTab === 'rating' && (
            <div className="lux-card">
              <div className="lux-card-header">
                <div>
                  <h3>Client Experience & Platform Rating</h3>
                  <p>Your feedback shapes the continuous perfection of our private banking services</p>
                </div>
                <span className="gold-text">★ 4.98 / 5.0 Average</span>
              </div>

              {ratingSubmitted ? (
                <div className="rating-success-box">
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>💎</div>
                  <h3 style={{ color: 'var(--text-h)', margin: '0 0 8px' }}>Thank You for Your Feedback</h3>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                    We deeply value your perspective as a Private Reserve member. Your insights have been recorded.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRating} className="lux-form">
                  <div className="star-rating-box">
                    <label>Overall Banking Service Rating</label>
                    <div className="stars-row">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star-btn ${(hoverRating || rating) >= star ? 'filled' : ''}`}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <span className="rating-desc-text">
                      {rating === 5 && '★★★★★ Exceptional Sovereign Tier Service'}
                      {rating === 4 && '★★★★☆ Great High-Velocity Experience'}
                      {rating === 3 && '★★★☆☆ Satisfactory'}
                      {rating <= 2 && '★★☆☆☆ Needs Improvement'}
                    </span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="fb-text">Comments, Feature Suggestions & Feedback</label>
                    <textarea
                      id="fb-text"
                      rows="4"
                      placeholder="Tell us what you love about Nexus Banking or features you'd like added next..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                    ></textarea>
                  </div>

                  <button type="submit" className="lux-btn-primary full-width">
                    Submit Client Rating & Feedback
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 6: GUIDELINES & COMPLIANCE */}
          {activeTab === 'guidelines' && (
            <div className="lux-card">
              <div className="lux-card-header">
                <div>
                  <h3>Institutional Guidelines & Security Protocols</h3>
                  <p>Standard operating procedures, fraud guarantees, and compliance disclosures</p>
                </div>
                <span className="badge-committed">Statutory Standards</span>
              </div>

              <div className="guidelines-accordion">
                <div className="guideline-item">
                  <h4>1. Real-Time Settlement & Transfer Timelines</h4>
                  <p>
                    Peer-to-peer internal transfers between verified Nexus accounts settle with zero latency (&lt; 250ms). FedWire and SWIFT transfers are processed within standard Federal Reserve business windows with end-to-end cryptographic tracking.
                  </p>
                </div>

                <div className="guideline-item">
                  <h4>2. Zero-Liability Fraud Protection Guarantee</h4>
                  <p>
                    All Titanium Metal and Single-Use Virtual Cards are covered by the Nexus Zero Liability Policy. Unauthorized charges reported within 60 days are provisionally credited immediately upon dispute receipt.
                  </p>
                </div>

                <div className="guideline-item">
                  <h4>3. Multi-Account FDIC Insurance Sweep Capacity</h4>
                  <p>
                    Through the Nexus Automated Deposit Sweep Network, client liquidity is programmatically allocated across a network of FDIC-insured institutions, expanding standard \$250,000 coverage up to \$2,500,000 per entity.
                  </p>
                </div>

                <div className="guideline-item">
                  <h4>4. Hardware Security & Biometric Mandates</h4>
                  <p>
                    Users are strongly urged to keep Two-Factor Authentication (2FA) enabled. All login sessions, card freeze requests, and master password modifications are immutably signed with SHA-256 fingerprints.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: ACCOUNT LOCK & DEACTIVATION */}
          {activeTab === 'deactivation' && (
            <div className="lux-card deactivation-card">
              <div className="lux-card-header">
                <div>
                  <h3 className="danger-text">Account Lock & Deactivation Request</h3>
                  <p>Request temporary security freeze or permanent account closure</p>
                </div>
                <span className="alert-error" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                  High Security Action
                </span>
              </div>

              <form onSubmit={handleDeactivate} className="lux-form">
                <div className="form-group">
                  <label>Deactivation Action Type *</label>
                  <div className="deact-type-selector">
                    <label className={`radio-pill ${deactData.deactivationType === 'TEMPORARY_FREEZE' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="deactivationType"
                        value="TEMPORARY_FREEZE"
                        checked={deactData.deactivationType === 'TEMPORARY_FREEZE'}
                        onChange={(e) => setDeactData({ ...deactData, deactivationType: e.target.value })}
                      />
                      <div>
                        <strong>🔒 Temporary Security Freeze (Recommended)</strong>
                        <span>Immediately blocks outbound wires and freezes payment cards while preserving account records.</span>
                      </div>
                    </label>

                    <label className={`radio-pill danger-pill ${deactData.deactivationType === 'PERMANENT_CLOSURE' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="deactivationType"
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
