import React, { createContext, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';

const AuthContext = createContext(null);

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

export const AuthProvider = ({ children }) => {
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

export const AuthCallback = () => null;

export default AuthProvider;
