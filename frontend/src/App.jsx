import { useState, useEffect, useCallback } from 'react';
import './App.css';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Dashboard from './components/Dashboard.jsx';
import AccountsView from './components/AccountsView.jsx';
import TransfersView from './components/TransfersView.jsx';
import CardsView from './components/CardsView.jsx';
import VaultView from './components/VaultView.jsx';
import SecurityView from './components/SecurityView.jsx';
import AnalyticsView from './components/AnalyticsView.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import AuthModal from './components/AuthModal.jsx';

const API_BASE_URL = 'http://localhost:8080';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [authModal, setAuthModal] = useState(null); // 'login' | 'register' | null

  // Real Database Financial State (Defaults to 0.00 and empty transaction list)
  const [balance, setBalance] = useState(0.00);
  const [transactions, setTransactions] = useState([]);

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
      if (res.ok && data?.success) {
        const updated = data.data;
        setCurrentUser(updated);
        setBalance(parseFloat(updated.balance) || 0.00);
      }
      fetchUserTransactions(currentUser.accountNumber);
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  }, [currentUser?.accountNumber, fetchUserTransactions]);

  useEffect(() => {
    if (currentUser?.accountNumber) {
      setBalance(parseFloat(currentUser.balance) || 0.00);
      fetchUserTransactions(currentUser.accountNumber);
    } else {
      setBalance(0.00);
      setTransactions([]);
    }
  }, [currentUser, fetchUserTransactions]);

  const handleLogout = () => {
    setCurrentUser(null);
    setBalance(0.00);
    setTransactions([]);
    setCurrentView('dashboard');
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setBalance(parseFloat(user.balance) || 0.00);
    setAuthModal(null);
    if (user.accountNumber) {
      fetchUserTransactions(user.accountNumber);
    }
  };

  const handleExecuteTransfer = async (amt, recipient, note) => {
    if (!currentUser?.accountNumber) {
      return { success: false, message: 'Must be logged in to transfer.' };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/transfers`, {
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
        setBalance((prev) => prev - amt);
        fetchUserTransactions(currentUser.accountNumber);
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
        onNavigate={setCurrentView}
        onOpenLogin={() => setAuthModal('login')}
        onOpenRegister={() => setAuthModal('register')}
        onLogout={handleLogout}
      />

      {/* Main Core View Area */}
      <main className="app-main-content">
        {currentView === 'dashboard' && (
          <Dashboard
            user={currentUser}
            balance={balance}
            transactions={transactions}
            onExecuteTransfer={handleExecuteTransfer}
            onNavigate={setCurrentView}
            onOpenLogin={() => setAuthModal('login')}
            onOpenRegister={() => setAuthModal('register')}
          />
        )}

        {currentView === 'admin' && currentUser?.role === 'ROLE_ADMIN' && (
          <AdminDashboard
            user={currentUser}
            onBackToDashboard={() => setCurrentView('dashboard')}
            onRefreshUser={refreshUserData}
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
            onOpenLogin={() => setAuthModal('login')}
          />
        )}

        {currentView === 'cards' && (
          <CardsView
            user={currentUser}
          />
        )}

        {currentView === 'vault' && (
          <VaultView />
        )}

        {currentView === 'security' && (
          <SecurityView />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView
            balance={balance}
          />
        )}
      </main>

      {/* Institutional Banking Footer */}
      <Footer onNavigate={setCurrentView} />

      {/* Popup Auth Modal (Login & Register) */}
      <AuthModal
        isOpen={Boolean(authModal)}
        initialMode={authModal || 'login'}
        onClose={(nextMode) => {
          if (typeof nextMode === 'string') {
            setAuthModal(nextMode);
          } else {
            setAuthModal(null);
          }
        }}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
