import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
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
  const [loading, setLoading] = useState(false);
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

  const getExternalAuthRedirectOrigin = () => {
    const configuredOrigin = process.env.REACT_APP_AUTH_REDIRECT_ORIGIN?.trim();
    if (configuredOrigin) {
      return configuredOrigin.replace(/\/+$/, '');
    }

    const { protocol, hostname, port } = window.location;
    // Use canonical apex domain in production so Emergent doesn't display "Www".
    const resolvedHost = hostname.toLowerCase() === 'www.investyz.com' ? 'investyz.com' : hostname;
    return `${protocol}//${resolvedHost}${port ? `:${port}` : ''}`;
  };

  const startExternalGoogleAuth = () => {
    const redirectUrl = `${getExternalAuthRedirectOrigin()}/auth/callback`;
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

    return saveAuthenticatedUser(payload);
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

    return saveAuthenticatedUser(payload);
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

    return saveAuthenticatedUser(payload);
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

  const connectWallet = (walletAddress, walletType = 'metamask') => {
    if (user) {
      setUser({ ...user, wallet_address: walletAddress, wallet_type: walletType });
    }
    return true;
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
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default AuthProvider;
