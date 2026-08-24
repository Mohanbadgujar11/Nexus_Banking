import { useState } from 'react';

function SecurityView() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Chrome on macOS (Current)', ip: '192.168.1.42', location: 'New York, USA', status: 'Active Now' },
    { id: 2, device: 'Nexus Mobile iOS App', ip: '172.56.21.9', location: 'New York, USA', status: 'Active 2h ago' },
  ]);
  const [revokeMsg, setRevokeMsg] = useState('');

  const handleRevokeSession = (id) => {
    setSessions(sessions.filter((s) => s.id !== id));
    setRevokeMsg('Session revoked. Invalidation token dispatched to Spring Security filter.');
    setTimeout(() => setRevokeMsg(''), 3500);
  };

  const auditLogs = [
    { id: 'LOG-99201', action: 'USER_LOGIN_BCRYPT_VERIFIED', hash: '0x8f19...d2a1', status: 'SUCCESS', time: 'Today, 10:14 PM' },
    { id: 'LOG-99200', action: 'LEDGER_DOUBLE_ENTRY_COMMIT', hash: '0x3c77...99e4', status: 'COMMITTED', time: 'Today, 09:30 AM' },
    { id: 'LOG-99199', action: 'API_KEY_ROTATION_DISPATCH', hash: '0x12bb...aa07', status: 'VERIFIED', time: 'Yesterday, 04:15 PM' },
  ];

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-badge">Cryptographic Security</div>
        <h1 className="view-title">Security & Audit Ledger</h1>
        <p className="view-subtitle">
          Real-time security telemetry, active cryptographic session management, and immutable double-entry ledger audits.
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
            <p>Your account is guarded by BCrypt password hashing, stateless Spring Security tokens, and 256-bit TLS encryption.</p>
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
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
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
                onClick={() => setBiometricEnabled(!biometricEnabled)}
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
            <h3>Immutable Double-Entry Audit Ledger</h3>
            <span className="audit-proof-tag">🔒 Sha-256 Hash Verified</span>
          </div>
          <p>Every transaction and security event is committed with a cryptographic verification hash in the MySQL core database.</p>
        </div>

        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Operation</th>
                <th>Ledger Hash</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td><code>{log.id}</code></td>
                  <td><strong>{log.action}</strong></td>
                  <td><code className="gold-text">{log.hash}</code></td>
                  <td><span className="badge-committed">{log.status}</span></td>
                  <td>{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SecurityView;

