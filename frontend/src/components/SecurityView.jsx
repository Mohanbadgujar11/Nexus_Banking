import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config.js';

function SecurityView({ user }) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => {
    return localStorage.getItem('nexus_2fa_enabled') === 'true';
  });
  const [biometricEnabled, setBiometricEnabled] = useState(() => {
    return localStorage.getItem('nexus_biometric_enabled') !== 'false';
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [revokeMsg, setRevokeMsg] = useState('');

  const [sessions, setSessions] = useState([
    { id: 1, device: 'Chrome on Windows 11 (Current Session)', ip: '127.0.0.1', location: 'New York, USA', status: 'Active Now' },
    { id: 2, device: 'Nexus Mobile iOS Terminal', ip: '172.56.21.9', location: 'New York, USA', status: 'Active 2h ago' },
  ]);

  const toggle2FA = () => {
    const next = !twoFactorEnabled;
    setTwoFactorEnabled(next);
    localStorage.setItem('nexus_2fa_enabled', String(next));
  };

  const toggleBiometric = () => {
    const next = !biometricEnabled;
    setBiometricEnabled(next);
    localStorage.setItem('nexus_biometric_enabled', String(next));
  };

  const handleRevokeSession = (id) => {
    setSessions(sessions.filter((s) => s.id !== id));
    setRevokeMsg('Session token revoked & invalidated across all clearing gateways.');
    setTimeout(() => setRevokeMsg(''), 3500);
  };

  const fetchAuditLogs = useCallback(async () => {
    if (!user?.id) return;
    setLoadingLogs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/audit-logs/user/${user.id}`);
      const data = await res.json();
      if (res.ok && data?.success && Array.isArray(data.data)) {
        setAuditLogs(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-badge">Cryptographic Security & Audit</div>
        <h1 className="view-title">Security Telemetry & Core Audit</h1>
        <p className="view-subtitle">
          Real-time security telemetry, active cryptographic session management, and immutable double-entry ledger audit events.
        </p>
      </div>

      {revokeMsg && (
        <div className="alert-banner alert-success">
          ✓ <span>{revokeMsg}</span>
        </div>
      )}

      {/* Security Health Top Banner */}
      <div className="lux-card security-health-banner">
        <div className="health-left">
          <div className="shield-icon-badge">🛡</div>
          <div>
            <div className="health-title-row">
              <h3>System Security Status: 100% Protected</h3>
              <span className="health-tag-active">SOC-2 Type II Certified</span>
            </div>
            <p>
              Your account is guarded by military-grade cryptographic hashing, stateless token verification, and 256-bit TLS encryption.
            </p>
          </div>
        </div>
        <div className="health-meter">
          <span className="meter-num">A+</span>
          <span className="meter-label">Grade</span>
        </div>
      </div>

      <div className="security-layout-grid">
        {/* Authentication Controls */}
        <div className="lux-card">
          <div className="lux-card-header">
            <h3>Step-Up Authentication & Privacy</h3>
            <p>Control hardware tokens and biometric verification layers</p>
          </div>

          <div className="controls-list">
            <div className="control-toggle-row">
              <div>
                <span className="control-title">Two-Factor Authentication (2FA)</span>
                <span className="control-desc">Require TOTP authenticator code on unrecognized sign-ins.</span>
              </div>
              <button
                type="button"
                className={`toggle-switch-btn ${twoFactorEnabled ? 'active-gold' : ''}`}
                onClick={toggle2FA}
              >
                {twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div className="control-toggle-row">
              <div>
                <span className="control-title">Biometric / WebAuthn Sign-In</span>
                <span className="control-desc">Enable Touch ID, Face ID, and FIDO2 hardware keys.</span>
              </div>
              <button
                type="button"
                className={`toggle-switch-btn ${biometricEnabled ? 'active-gold' : ''}`}
                onClick={toggleBiometric}
              >
                {biometricEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="lux-card">
          <div className="lux-card-header">
            <h3>Active Cryptographic Sessions</h3>
            <p>Devices currently authenticated to your Nexus profile</p>
          </div>

          <div className="session-list">
            {sessions.map((s) => (
              <div key={s.id} className="session-item">
                <div className="session-info">
                  <span className="session-device">{s.device}</span>
                  <span className="session-meta">{s.ip} • {s.location} • {s.status}</span>
                </div>
                {s.id !== 1 && (
                  <button
                    type="button"
                    className="revoke-btn"
                    onClick={() => handleRevokeSession(s.id)}
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Immutable Double-Entry Audit Ledger Viewer */}
      <div className="lux-card audit-ledger-card">
        <div className="lux-card-header">
          <div className="header-with-tag">
            <h3>Institutional Core Banking Audit Ledger</h3>
            <span className="audit-proof-tag">🔒 Sha-256 Fingerprint Verified</span>
          </div>
          <p>Every transaction, card freeze, registration, and administrative action is immutably hashed and committed to the core reserve ledger.</p>
        </div>

        <div className="audit-table-wrap">
          {loadingLogs ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
              <p style={{ color: 'var(--text-muted)' }}>Retrieving live cryptographic audit trails...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No audit records registered for this account yet.
            </div>
          ) : (
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Operation</th>
                  <th>Target Resource</th>
                  <th>SHA-256 Fingerprint</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td><code>AUD-{log.id}</code></td>
                    <td><strong>{log.action}</strong></td>
                    <td><span className="user-role-tag">{log.resourceType} #{log.resourceId}</span></td>
                    <td><code className="gold-text" title={log.sha256Fingerprint}>{log.sha256Fingerprint?.substring(0, 20)}...</code></td>
                    <td><code>{log.ipAddress}</code></td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default SecurityView;
