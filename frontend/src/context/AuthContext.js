import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import apiClient, { setApiAuthProvider, unwrap } from '../lib/apiClient';

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
  const [account, setAccount] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [walletProfile, setWalletProfile] = useState(null);

  const user = useMemo(() => {
    if (!clerkUser && !account) return null;

    const baseUser = account || {};
    const fallbackName = buildDisplayName(clerkUser);
    const fallbackEmail = clerkUser?.primaryEmailAddress?.emailAddress || '';
    const fallbackPicture = clerkUser?.imageUrl || '';

    return {
      ...baseUser,
      user_id: baseUser.user_id || clerkUser?.id,
      id: baseUser.user_id || clerkUser?.id,
      name: baseUser.name || fallbackName,
      email: baseUser.email || fallbackEmail,
      picture: baseUser.picture || fallbackPicture,
      auth_provider: 'clerk',
      wallet_address: walletProfile?.wallet_address || baseUser.wallet_address || '',
      wallet_type: walletProfile?.wallet_type || baseUser.wallet_type || '',
      wallet_chain_id: walletProfile?.wallet_chain_id || baseUser.wallet_chain_id || '',
    };
  }, [account, clerkUser, walletProfile]);

  const getClerkApiAuth = useCallback(async () => {
    if (!clerkUser || !clerk.session) return null;

    const token = await clerk.session.getToken();
    if (!token) return null;

    return {
      token,
      user: {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        name: buildDisplayName(clerkUser),
        picture: clerkUser.imageUrl || '',
        email_verified: true,
        phone: clerkUser.primaryPhoneNumber?.phoneNumber || '',
        phone_verified: Boolean(clerkUser.primaryPhoneNumber?.verification?.status === 'verified'),
      },
    };
  }, [clerk.session, clerkUser]);

  const checkAuth = useCallback(async () => {
    if (!clerkUser) {
      setAccount(null);
      return null;
    }

    const data = unwrap(await apiClient.get('/api/auth/me'));
    setAccount(data);
    return data;
  }, [clerkUser]);

  React.useEffect(() => {
    if (!CLERK_ENABLED) return undefined;

    setApiAuthProvider(() => getClerkApiAuth());
    return () => setApiAuthProvider(null);
  }, [getClerkApiAuth]);

  React.useEffect(() => {
    if (!isLoaded) return;
    if (!clerkUser) {
      setAccount(null);
      return;
    }

    let cancelled = false;
    setSyncing(true);

    checkAuth()
      .catch(() => {
        if (!cancelled) {
          setAccount(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSyncing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [checkAuth, clerkUser, isLoaded]);

  const login = () => {
    navigate('/login');
  };

  const signup = () => {
    navigate('/signup');
  };

  const logout = async () => {
    await clerk.signOut();
    setAccount(null);
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
        loading: !isLoaded || syncing,
        login,
        signup,
        startExternalGoogleAuth: login,
        signupWithEmail: signup,
        loginWithEmail: login,
        loginWithGoogle: login,
        requestOtp: async (channel, values = {}) => unwrap(await apiClient.post('/api/auth/otp/request', { channel, ...values })),
        verifyOtp: async (channel, otp) => {
          const data = unwrap(await apiClient.post('/api/auth/otp/verify', { channel, otp }));
          setAccount(data);
          return data;
        },
        updateProfile: async (updates) => {
          const data = unwrap(await apiClient.patch('/api/auth/profile', updates));
          setAccount(data);
          return data;
        },
        logout,
        checkAuth,
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
