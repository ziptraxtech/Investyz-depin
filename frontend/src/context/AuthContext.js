import React, { createContext, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';

const AuthContext = createContext(null);
const CLERK_PUBLISHABLE_KEY =
  process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
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

  const user = useMemo(() => {
    if (!walletProfile) return null;

    return {
      user_id: '',
      id: '',
      name: '',
      email: '',
      picture: '',
      auth_provider: 'local',
      wallet_address: walletProfile.wallet_address || '',
      wallet_type: walletProfile.wallet_type || '',
      wallet_chain_id: walletProfile.wallet_chain_id || '',
    };
  }, [walletProfile]);

  const login = () => {
    navigate('/login');
  };

  const signup = () => {
    navigate('/signup');
  };

  const logout = async () => {
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
        isAuthenticated: false,
        setUser: () => {},
        loading: false,
        login,
        signup,
        startExternalGoogleAuth: login,
        signupWithEmail: signup,
        loginWithEmail: login,
        loginWithGoogle: login,
        logout,
        checkAuth: async () => null,
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
