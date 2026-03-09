import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL;

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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getResponseData = useCallback((payload) => payload?.data ?? payload, []);

  const saveAuthenticatedUser = useCallback((payload) => {
    const data = getResponseData(payload);
    const authenticatedUser = data?.user ?? data;
    if (authenticatedUser?.email) {
      setUser(authenticatedUser);
      return authenticatedUser;
    }
    return null;
  }, [getResponseData]);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
      });
      if (response.ok) {
        const payload = await response.json();
        const authenticatedUser = saveAuthenticatedUser(payload);
        if (!authenticatedUser) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [saveAuthenticatedUser]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = () => {
    navigate('/login');
  };

  const startExternalGoogleAuth = () => {
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const signupWithEmail = async ({ name, email, password }) => {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || 'Signup failed');
    }
    const authenticatedUser = saveAuthenticatedUser(payload);
    return authenticatedUser;
  };

  const loginWithEmail = async ({ email, password }) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || 'Login failed');
    }
    const authenticatedUser = saveAuthenticatedUser(payload);
    return authenticatedUser;
  };

  const loginWithGoogle = async (idToken) => {
    const response = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || 'Google login failed');
    }
    const authenticatedUser = saveAuthenticatedUser(payload);
    return authenticatedUser;
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    navigate('/');
  };

  const connectWallet = async (walletAddress, walletType = 'metamask', chainId = 1) => {
    try {
      const response = await fetch(`${API_URL}/api/wallet/connect`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          wallet_address: walletAddress,
          wallet_type: walletType,
          chain_id: chainId,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.data);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Connect wallet error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        startExternalGoogleAuth,
        signupWithEmail,
        loginWithEmail,
        loginWithGoogle,
        logout,
        checkAuth,
        connectWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Auth callback component
export const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = location.hash;
      const params = new URLSearchParams(hash.replace('#', ''));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        navigate('/');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/session`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (response.ok) {
          const payload = await response.json();
          const data = payload?.data || payload;
          const authenticatedUser = data?.user || data;
          setUser(authenticatedUser);
          navigate('/dashboard', { state: { user: authenticatedUser } });
        } else {
          console.error('Auth failed');
          navigate('/');
        }
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/');
      }
    };

    processAuth();
  }, [location, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center hero-gradient">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Authenticating...</p>
      </div>
    </div>
  );
};

export default AuthProvider;
