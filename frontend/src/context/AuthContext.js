import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import apiClient, { unwrap } from '../lib/apiClient';

const AuthContext = createContext(null);
const getClerkPublishableKey = () => {
  const buildKey =
    process.env.REACT_APP_CLERK_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    process.env.CLERK_PUBLISHABLE_KEY;

  if (buildKey) {
    return buildKey;
  }

  if (typeof window !== 'undefined') {
    return (
      window.REACT_APP_CLERK_PUBLISHABLE_KEY ||
      window.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
      window.CLERK_PUBLISHABLE_KEY ||
      ''
    );
  }

  return '';
};

const CLERK_PUBLISHABLE_KEY = getClerkPublishableKey();
const CLERK_ENABLED = Boolean(CLERK_PUBLISHABLE_KEY);

const buildDisplayName = (clerkUser) => {
  if (!clerkUser) return '';
  if (clerkUser.fullName) return clerkUser.fullName;
  const combinedName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim();
  return combinedName || clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress || '';
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const ClerkAuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const { isLoaded, user: clerkUser } = useUser();
  const clerk = useClerk();
  const [walletProfile, setWalletProfile] = useState(null);

  const user = useMemo(() => {
    if (!clerkUser) return null;

    return {
      user_id: clerkUser.id,
      id: clerkUser.id,
      name: buildDisplayName(clerkUser),
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      picture: clerkUser.imageUrl || '',
      auth_provider: 'clerk',
      wallet_address: walletProfile?.wallet_address || '',
      wallet_type: walletProfile?.wallet_type || '',
      wallet_chain_id: walletProfile?.wallet_chain_id || '',
    };
  }, [clerkUser, walletProfile]);

  const login = () => {
    navigate('/login');
  };

  const signup = () => {
    navigate('/signup');
  };

  const logout = async () => {
    await clerk.signOut();
    setWalletProfile(null);
    navigate('/');
  };

  const connectWallet = (walletAddress, walletType = 'metamask', walletChainId = '137') => {
    setWalletProfile({
      wallet_address: walletAddress,
      wallet_type: walletType,
      wallet_chain_id: walletChainId,
    });
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        setUser: () => {},
        loading: !isLoaded,
        login,
        signup,
        startExternalGoogleAuth: login,
        signupWithEmail: signup,
        loginWithEmail: login,
        loginWithGoogle: login,
        requestOtp: async () => {
          throw new Error('OTP verification is handled by the platform auth flow');
        },
        verifyOtp: async () => {
          throw new Error('OTP verification is handled by the platform auth flow');
        },
        updateProfile: async () => user,
        logout,
        checkAuth: async () => user,
        connectWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const LocalAuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [walletProfile, setWalletProfile] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = useMemo(() => {
    if (!account) return null;

    return {
      ...account,
      id: account.user_id,
      picture: '',
      auth_provider: 'local',
      wallet_address: walletProfile?.wallet_address || account.wallet_address || '',
      wallet_type: walletProfile?.wallet_type || account.wallet_type || '',
      wallet_chain_id: walletProfile?.wallet_chain_id || account.wallet_chain_id || '',
    };
  }, [account, walletProfile]);

  React.useEffect(() => {
    const restore = async () => {
      if (!localStorage.getItem('investyz_access_token')) {
        setLoading(false);
        return;
      }

      try {
        const data = unwrap(await apiClient.get('/api/auth/me'));
        setAccount(data);
      } catch {
        localStorage.removeItem('investyz_access_token');
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const login = () => {
    navigate('/login');
  };

  const signup = () => {
    navigate('/signup');
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Local cleanup still matters if the server session already expired.
    }
    localStorage.removeItem('investyz_access_token');
    setAccount(null);
    setWalletProfile(null);
    navigate('/');
  };

  const storeAuthResult = (payload) => {
    if (payload.access_token) {
      localStorage.setItem('investyz_access_token', payload.access_token);
    }
    setAccount(payload.user);
    return payload.user;
  };

  const signupWithEmail = async ({ name, email, phone, password }) => {
    const data = unwrap(await apiClient.post('/api/auth/signup', { name, email, phone, password }));
    return storeAuthResult(data);
  };

  const loginWithEmail = async ({ email, password }) => {
    const data = unwrap(await apiClient.post('/api/auth/login', { email, password }));
    return storeAuthResult(data);
  };

  const updateProfile = useCallback(async (updates) => {
    const data = unwrap(await apiClient.patch('/api/auth/profile', updates));
    setAccount(data);
    return data;
  }, []);

  const requestOtp = useCallback(async (channel, values = {}) => unwrap(await apiClient.post('/api/auth/otp/request', { channel, ...values })), []);

  const verifyOtp = useCallback(async (channel, otp) => {
    const data = unwrap(await apiClient.post('/api/auth/otp/verify', { channel, otp }));
    setAccount(data);
    return data;
  }, []);

  const checkAuth = useCallback(async () => {
    const data = unwrap(await apiClient.get('/api/auth/me'));
    setAccount(data);
    return data;
  }, []);

  const connectWallet = (walletAddress, walletType = 'metamask', walletChainId = '137') => {
    setWalletProfile({
      wallet_address: walletAddress,
      wallet_type: walletType,
      wallet_chain_id: walletChainId,
    });
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        setUser: setAccount,
        loading,
        login,
        signup,
        startExternalGoogleAuth: login,
        signupWithEmail,
        loginWithEmail,
        loginWithGoogle: login,
        requestOtp,
        verifyOtp,
        updateProfile,
        logout,
        checkAuth,
        connectWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = ({ children }) => {
  if (!CLERK_ENABLED) {
    return <LocalAuthProvider>{children}</LocalAuthProvider>;
  }

  return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
};

export const AuthCallback = () => null;

export default AuthProvider;
