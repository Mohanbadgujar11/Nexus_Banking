import { useState, useEffect, useCallback } from 'react';
import './App.css';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import AuthGate from './components/AuthGate.jsx';
import Dashboard from './components/Dashboard.jsx';
import AccountsView from './components/AccountsView.jsx';
import TransfersView from './components/TransfersView.jsx';
import CardsView from './components/CardsView.jsx';
import VaultView from './components/VaultView.jsx';
import SecurityView from './components/SecurityView.jsx';
import AnalyticsView from './components/AnalyticsView.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import UserProfileView from './components/UserProfileView.jsx';
import { API_BASE_URL } from './config.js';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState('dashboard');
  const [authGateMode, setAuthGateMode] = useState('login'); // 'login' | 'register'

  // Real Database Financial State
  const [balance, setBalance] = useState(() => {
    return currentUser?.balance ? parseFloat(currentUser.balance) : 0.00;
  });
  const [transactions, setTransactions] = useState([]);

  // Top scroll utility ensuring view changes always scroll to the very top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
    scrollToTop();
  };

  const handleSetAuthMode = (mode) => {
    setAuthGateMode(mode);
    scrollToTop();
  };

  const isLoggedIn = Boolean(currentUser);

  // Scroll to top whenever the active view or auth mode changes
  useEffect(() => {
    scrollToTop();
  }, [currentView, authGateMode, isLoggedIn]);

  const fetchUserTransactions = useCallback(async (accountNumber) => {
    if (!accountNumber) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/transactions/account/${accountNumber}`);
      const data = await res.json();
      if (res.ok && data?.success) {
        setTransactions(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!currentUser?.accountNumber) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/account/${currentUser.accountNumber}`);
      const data = await res.json();
      if (res.ok && data?.success && data.data) {
        const updated = data.data;
        setCurrentUser(updated);
        localStorage.setItem('nexus_current_user', JSON.stringify(updated));
        setBalance(parseFloat(updated.balance) || 0.00);
      }
      fetchUserTransactions(currentUser.accountNumber);
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  }, [currentUser?.accountNumber, fetchUserTransactions]);

  // Sync on initial load and when user changes
  useEffect(() => {
    if (currentUser?.accountNumber) {
      setBalance(parseFloat(currentUser.balance) || 0.00);
      localStorage.setItem('nexus_current_user', JSON.stringify(currentUser));
      refreshUserData();
    } else {
      setBalance(0.00);
      setTransactions([]);
    }
  }, [currentUser?.accountNumber, refreshUserData]);

  const handleLogout = () => {
    localStorage.removeItem('nexus_current_user');
    setCurrentUser(null);
    setBalance(0.00);
    setTransactions([]);
    setCurrentView('dashboard');
    setAuthGateMode('login');
    scrollToTop();
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('nexus_current_user', JSON.stringify(user));
    setBalance(parseFloat(user.balance) || 0.00);
    setCurrentView('dashboard');
    scrollToTop();
    if (user.accountNumber) {
      fetchUserTransactions(user.accountNumber);
    }
  };

  const handleUpdateUserProfile = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('nexus_current_user', JSON.stringify(updatedUser));
  };

  const handleExecuteTransfer = async (amt, recipient, note) => {
    if (!currentUser?.accountNumber) {
      return { success: false, message: 'Must be logged in to transfer.' };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/transactions/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderAccountNumber: currentUser.accountNumber,
          receiverAccountNumber: recipient,
          amount: amt,
          memo: note,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        // Refresh full state from database
        await refreshUserData();
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data?.message || 'Transfer rejected by core ledger.' };
      }
    } catch (err) {
      console.error('Transfer API error:', err);
      return { success: false, message: 'Could not connect to core transfer service.' };
    }
  };

  return (
    <div className="app-root-layout">
      {/* Sticky Top Header with Dropdown Navigation & Auth Controls */}
      <Header
        user={currentUser}
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenLogin={() => handleSetAuthMode('login')}
        onOpenRegister={() => handleSetAuthMode('register')}
        onLogout={handleLogout}
      />

      {/* Main Core View Area */}
      <main className="app-main-content">
        {!currentUser ? (
          /* AUTHENTICATION GATE: User must sign in or register before accessing the banking core */
          <AuthGate
            key={authGateMode}
            initialMode={authGateMode}
            onAuthSuccess={handleAuthSuccess}
          />
        ) : (
          /* AUTHENTICATED BANKING ENVIRONMENT */
          <>
            {currentView === 'dashboard' && (
              <Dashboard
                user={currentUser}
                balance={balance}
                transactions={transactions}
                onExecuteTransfer={handleExecuteTransfer}
                onNavigate={handleNavigate}
                onOpenLogin={() => handleSetAuthMode('login')}
                onOpenRegister={() => handleSetAuthMode('register')}
              />
            )}

            {currentView === 'admin' && currentUser?.role === 'ROLE_ADMIN' && (
              <AdminDashboard
                user={currentUser}
                onBackToDashboard={() => handleNavigate('dashboard')}
                onRefreshUser={refreshUserData}
              />
            )}

            {currentView === 'profile' && (
              <UserProfileView
                user={currentUser}
                onUpdateUser={handleUpdateUserProfile}
                onLogout={handleLogout}
              />
            )}

            {currentView === 'accounts' && (
              <AccountsView
                user={currentUser}
                balance={balance}
              />
            )}

            {currentView === 'transfers' && (
              <TransfersView
                user={currentUser}
                balance={balance}
                onExecuteTransfer={handleExecuteTransfer}
                onOpenLogin={() => handleSetAuthMode('login')}
              />
            )}

            {currentView === 'cards' && (
              <CardsView
                user={currentUser}
              />
            )}

            {currentView === 'vault' && (
              <VaultView user={currentUser} balance={balance} />
            )}

            {currentView === 'security' && (
              <SecurityView user={currentUser} />
            )}

            {currentView === 'analytics' && (
              <AnalyticsView
                user={currentUser}
                balance={balance}
                transactions={transactions}
              />
            )}
          </>
        )}
      </main>

      {/* Institutional Banking Footer */}
      <Footer onNavigate={(v) => {
        if (currentUser) {
          handleNavigate(v);
        } else {
          handleSetAuthMode('login');
        }
      }} />
    </div>
  );
}

export default App;
