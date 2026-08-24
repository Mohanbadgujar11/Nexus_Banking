import { useState, useEffect } from 'react';
import Login from './Login.jsx';
import Register from './Register.jsx';

function AuthModal({ initialMode = 'login', isOpen, onClose, onAuthSuccess }) {
  const [modalMode, setModalMode] = useState(initialMode);
  const [prefilledIdentifier, setPrefilledIdentifier] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState('');

  useEffect(() => {
    setModalMode(initialMode);
    if (initialMode === 'register') {
      setPrefilledIdentifier('');
      setRegSuccessMessage('');
    }
  }, [initialMode, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRegisterSuccess = (registeredUser) => {
    // DO NOT log in directly. Switch to login screen and prompt user to authenticate with credentials.
    setPrefilledIdentifier(registeredUser?.username || registeredUser?.email || '');
    setRegSuccessMessage('Account created successfully! Please enter your password to sign in.');
    setModalMode('login');
  };

  return (
    <div className="modal-backdrop" onClick={() => onClose()}>
      <div
        className={`modal-content ${modalMode === 'register' ? 'modal-register-wide' : 'modal-login-compact'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={() => onClose()}
          aria-label="Close modal"
        >
          ✕
        </button>

        {modalMode === 'login' ? (
          <Login
            initialIdentifier={prefilledIdentifier}
            registrationMessage={regSuccessMessage}
            onNavigateToRegister={() => {
              setRegSuccessMessage('');
              setModalMode('register');
            }}
            onLoginSuccess={(user) => {
              onAuthSuccess(user);
              onClose();
            }}
          />
        ) : (
          <Register
            onNavigateToLogin={() => {
              setRegSuccessMessage('');
              setModalMode('login');
            }}
            onRegisterSuccess={handleRegisterSuccess}
          />
        )}
      </div>
    </div>
  );
}

export default AuthModal;
