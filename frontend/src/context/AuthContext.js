import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading] = useState(false);
  const navigate = useNavigate();

  const login = () => {
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = () => {
    setUser(null);
    navigate('/');
  };

  const connectWallet = (walletAddress, walletType = 'metamask') => {
    if (user) {
      setUser({ ...user, wallet_address: walletAddress, wallet_type: walletType });
    }
    return true;
  };

  const checkAuth = () => {};

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, checkAuth, connectWallet }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthCallback = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate('/'); }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center hero-gradient">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default AuthProvider;
