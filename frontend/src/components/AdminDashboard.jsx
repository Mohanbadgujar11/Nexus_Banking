import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8080';

function AdminDashboard({ user, onBackToDashboard, onRefreshUser }) {
  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' | 'users' | 'ledger'
  const [usersList, setUsersList] = useState([]);
  const [globalTransactions, setGlobalTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Deposit Form State
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMemo, setDepositMemo] = useState('Central Treasury Capital Deposit');

  // Edit User State
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    role: 'ROLE_USER',
  });

  useEffect(() => {
    fetchUsers();
    fetchGlobalTransactions();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`);
      const data = await res.json();
      if (res.ok && data?.success) {
        setUsersList(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchGlobalTransactions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/transactions`);
      const data = await res.json();
      if (res.ok && data?.success) {
        setGlobalTransactions(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/search?query=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (res.ok && data?.success && data.data?.length > 0) {
        setFoundUser(data.data[0]);
        setStatusMsg({ type: 'success', text: `Found account for ${data.data[0].fullName}` });
      } else {
        setFoundUser(null);
        setStatusMsg({ type: 'error', text: `No user or account found matching "${searchQuery}"` });
      }
    } catch (err) {
      console.error('Search error:', err);
      setStatusMsg({ type: 'error', text: 'Failed to query user database.' });
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteDeposit = async (e) => {
    e.preventDefault();
    if (!foundUser) return;
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid deposit amount.' });
      return;
    }

    setLoading(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: foundUser.accountNumber,
          amount: amt,
          memo: depositMemo || 'Admin Capital Injection',
        }),
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        setStatusMsg({
          type: 'success',
          text: `Successfully deposited $${amt.toFixed(2)} into ${foundUser.fullName}'s account (${foundUser.accountNumber})!`,
        });
        setDepositAmount('');
        // Refresh users list and user card
        fetchUsers();
        fetchGlobalTransactions();
        if (onRefreshUser && foundUser.id === user?.id) {
          onRefreshUser();
        }
        // Update local found user balance
        setFoundUser((prev) => prev ? { ...prev, balance: (parseFloat(prev.balance) || 0) + amt } : null);
      } else {
        setStatusMsg({ type: 'error', text: data?.message || 'Deposit failed.' });
      }
    } catch (err) {
      console.error('Deposit error:', err);
      setStatusMsg({ type: 'error', text: 'Error connecting to backend server.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userFullName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userFullName}"? This action is permanent.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setStatusMsg({ type: 'success', text: `User "${userFullName}" deleted successfully.` });
        fetchUsers();
        if (foundUser?.id === userId) {
          setFoundUser(null);
        }
      } else {
        setStatusMsg({ type: 'error', text: data?.message || 'Delete failed.' });
      }
    } catch (err) {
      console.error('Delete error:', err);
      setStatusMsg({ type: 'error', text: 'Error executing user deletion.' });
    }
  };

  const handleStartEdit = (u) => {
    setEditingUser(u);
    setEditFormData({
      fullName: u.fullName || '',
      email: u.email || '',
      phoneNumber: u.phoneNumber || '',
      address: u.address || '',
      role: u.role || 'ROLE_USER',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        setStatusMsg({ type: 'success', text: `Updated user "${editFormData.fullName}" successfully.` });
        setEditingUser(null);
        fetchUsers();
      } else {
        setStatusMsg({ type: 'error', text: data?.message || 'Update failed.' });
      }
    } catch (err) {
      console.error('Edit error:', err);
      setStatusMsg({ type: 'error', text: 'Failed to update user.' });
    }
  };

  return (
    <div className="view-container admin-console-container">
      {/* Header Bar */}
      <div className="admin-header-row">
        <div>
          <div className="view-badge admin-badge">🛡 Central Administrator Console</div>
          <h1 className="view-title">Bank Operations & Treasury</h1>
          <p className="view-subtitle">
            Authenticated Admin: <strong>@{user?.username}</strong> ({user?.accountNumber || 'NX-ADMIN-0001'})
          </p>
        </div>
        <button type="button" className="lux-btn-secondary" onClick={onBackToDashboard}>
          ← Return to Member View
        </button>
      </div>

      {statusMsg.text && (
        <div className={`alert-banner ${statusMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="admin-nav-tabs">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'deposit' ? 'active' : ''}`}
          onClick={() => setActiveTab('deposit')}
        >
          💰 Deposit Funds to Client
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Client Directory ({usersList.length})
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          📋 Global Audit Ledger ({globalTransactions.length})
        </button>
      </div>

      {/* TAB 1: DEPOSIT FUNDS */}
      {activeTab === 'deposit' && (
        <div className="admin-tab-content">
          <div className="lux-card">
            <div className="lux-card-header">
              <div>
                <h3>Deposit Capital Engine</h3>
                <p>Search any client by unique Account Number (e.g. NX-...) or Username to deposit funds</p>
              </div>
            </div>

            {/* User Search Form */}
            <form onSubmit={handleSearchUser} className="admin-search-form">
              <div className="search-input-group">
                <input
                  type="text"
                  placeholder="Enter Account Number (e.g. NX-1049281048), Username, or Full Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  required
                />
                <button type="submit" className="lux-btn-primary search-btn" disabled={loading}>
                  {loading ? 'Searching...' : '🔍 Search Account'}
                </button>
              </div>
            </form>

            {/* Found User Details & Deposit Box */}
            {foundUser && (
              <div className="found-user-card">
                <div className="fuc-top">
                  <div>
                    <span className="user-role-tag">{foundUser.role}</span>
                    <h4>{foundUser.fullName}</h4>
                    <span className="fuc-sub">@{foundUser.username} • {foundUser.email}</span>
                  </div>
                  <div className="fuc-balance-badge">
                    <span className="fuc-lbl">CURRENT BALANCE</span>
                    <span className="fuc-bal">
                      ${(parseFloat(foundUser.balance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                    </span>
                  </div>
                </div>

                <div className="fuc-meta-grid">
                  <div>
                    <span className="meta-k">Unique Account Number</span>
                    <code className="meta-v gold-text">{foundUser.accountNumber}</code>
                  </div>
                  <div>
                    <span className="meta-k">Phone</span>
                    <span className="meta-v">{foundUser.phoneNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="meta-k">Address</span>
                    <span className="meta-v">{foundUser.address || 'N/A'}</span>
                  </div>
                </div>

                {/* Deposit Action Form */}
                <form onSubmit={handleExecuteDeposit} className="deposit-action-form">
                  <div className="form-row-dual">
                    <div className="form-group">
                      <label htmlFor="dep-amt">Deposit Amount ($ USD) *</label>
                      <input
                        id="dep-amt"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="e.g. 5000.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="dep-memo">Treasury Memo / Reason</label>
                      <input
                        id="dep-memo"
                        type="text"
                        placeholder="e.g. Initial Client Deposit / Loan Credit"
                        value={depositMemo}
                        onChange={(e) => setDepositMemo(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" className="lux-btn-primary full-width" disabled={loading}>
                    {loading ? 'Committing to Core Ledger...' : `Authorize & Deposit $${depositAmount || '0.00'} to ${foundUser.fullName}`}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: USER DIRECTORY */}
      {activeTab === 'users' && (
        <div className="admin-tab-content">
          <div className="lux-card">
            <div className="lux-card-header">
              <div>
                <h3>Registered Client Accounts Directory</h3>
                <p>Manage all registered individuals and banking administrators</p>
              </div>
              <button type="button" className="lux-btn-secondary" onClick={fetchUsers}>
                ↻ Refresh List
              </button>
            </div>

            <div className="tx-table-container">
              <table className="lux-table">
                <thead>
                  <tr>
                    <th>Account Number</th>
                    <th>Client Name</th>
                    <th>Username / Email</th>
                    <th>Role</th>
                    <th style={{ textAlign: 'right' }}>Live Balance</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <code className="gold-text">{u.accountNumber}</code>
                      </td>
                      <td>
                        <strong>{u.fullName}</strong>
                        <div className="tx-time-col">{u.phoneNumber || 'No phone'}</div>
                      </td>
                      <td>
                        <div>@{u.username}</div>
                        <div className="tx-time-col">{u.email}</div>
                      </td>
                      <td>
                        <span className={u.role === 'ROLE_ADMIN' ? 'verified-tag' : 'badge-committed'}>
                          {u.role === 'ROLE_ADMIN' ? 'ADMIN' : 'CLIENT'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="tx-amount-text credit">
                          ${(parseFloat(u.balance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="admin-action-btns">
                          <button
                            type="button"
                            className="admin-btn-sm"
                            onClick={() => {
                              setFoundUser(u);
                              setActiveTab('deposit');
                            }}
                            title="Deposit Funds"
                          >
                            💵 Deposit
                          </button>
                          <button
                            type="button"
                            className="admin-btn-sm"
                            onClick={() => handleStartEdit(u)}
                            title="Edit Client"
                          >
                            ✎ Edit
                          </button>
                          {u.id !== user?.id && (
                            <button
                              type="button"
                              className="admin-btn-sm btn-delete"
                              onClick={() => handleDeleteUser(u.id, u.fullName)}
                              title="Delete Client"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL AUDIT LEDGER */}
      {activeTab === 'ledger' && (
        <div className="admin-tab-content">
          <div className="lux-card">
            <div className="lux-card-header">
              <div>
                <h3>Global Double-Entry Core Ledger</h3>
                <p>Complete historical record of all deposits, transfers, and disbursements</p>
              </div>
              <button type="button" className="lux-btn-secondary" onClick={fetchGlobalTransactions}>
                ↻ Refresh Ledger
              </button>
            </div>

            <div className="tx-table-container">
              <table className="lux-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Sender Account</th>
                    <th>Receiver Account</th>
                    <th>Description / Memo</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {globalTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No transactions recorded yet in core ledger.
                      </td>
                    </tr>
                  ) : (
                    globalTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>
                          <code>{tx.transactionReference}</code>
                        </td>
                        <td>
                          <span className={`lux-tx-badge ${tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_CREDIT' ? 'credit' : 'debit'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td>
                          <code>{tx.senderAccountNumber || 'TREASURY'}</code>
                        </td>
                        <td>
                          <code className="gold-text">{tx.receiverAccountNumber}</code>
                        </td>
                        <td>{tx.description}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`tx-amount-text ${tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_CREDIT' ? 'credit' : 'debit'}`}>
                            ${(parseFloat(tx.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="tx-time-col">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'Recent'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="modal-backdrop" onClick={() => setEditingUser(null)}>
          <div className="modal-content lux-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={() => setEditingUser(null)}>
              ✕
            </button>
            <div className="auth-card-header">
              <div className="view-badge">Admin Edit Mode</div>
              <h3 className="auth-title">Update Client Account</h3>
              <p className="auth-subtitle">Editing account: {editingUser.accountNumber}</p>
            </div>

            <form onSubmit={handleSaveEdit} className="lux-form">
              <div className="form-group">
                <label>Full Legal Name</label>
                <input
                  type="text"
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={editFormData.phoneNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Residential Address</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Account Role</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                >
                  <option value="ROLE_USER">Individual Client (ROLE_USER)</option>
                  <option value="ROLE_ADMIN">Administrator (ROLE_ADMIN)</option>
                </select>
              </div>

              <button type="submit" className="lux-btn-primary full-width">
                Save & Commit Client Updates
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

