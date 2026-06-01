import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';

const WalletContext = createContext(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

// EVM Wallet Types
const WALLET_TYPES = {
  METAMASK: 'metamask',
  TRUST_WALLET: 'trust_wallet',
  WALLETCONNECT: 'walletconnect',
  COINBASE: 'coinbase',
};

// Polygon Network Configuration
const POLYGON_CHAIN_ID = 137;
const WALLET_DISCONNECTED_KEY = 'investyz_wallet_disconnected';
const POLYGON_CONFIG = {
  chainId: `0x${POLYGON_CHAIN_ID.toString(16)}`, // 0x89
  chainName: 'Polygon Mainnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: ['https://polygon-rpc.com', 'https://rpc-mainnet.maticvigil.com'],
  blockExplorerUrls: ['https://polygonscan.com'],
};

// Wallet configurations
const WALLETS = [
  {
    type: WALLET_TYPES.METAMASK,
    name: 'MetaMask',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
    downloadUrl: 'https://metamask.io/download/',
  },
  {
    type: WALLET_TYPES.TRUST_WALLET,
    name: 'Trust Wallet',
    icon: 'https://trustwallet.com/assets/images/media/assets/TWT.svg',
    downloadUrl: 'https://trustwallet.com/download',
  },
  {
    type: WALLET_TYPES.WALLETCONNECT,
    name: 'WalletConnect',
    icon: 'https://walletconnect.com/walletconnect-logo.png',
    downloadUrl: 'https://walletconnect.com/',
  },
  {
    type: WALLET_TYPES.COINBASE,
    name: 'Coinbase Wallet',
    icon: 'https://www.coinbase.com/img/favicon/favicon-256.png',
    downloadUrl: 'https://www.coinbase.com/wallet/downloads',
  },
];

export const WalletProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [switchingChain, setSwitchingChain] = useState(false);
  const activeProviderRef = useRef(null);

  const getDisconnectPreference = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(WALLET_DISCONNECTED_KEY) === 'true';
  }, []);

  const setDisconnectPreference = useCallback((value) => {
    if (typeof window === 'undefined') return;
    if (value) {
      window.localStorage.setItem(WALLET_DISCONNECTED_KEY, 'true');
      return;
    }
    window.localStorage.removeItem(WALLET_DISCONNECTED_KEY);
  }, []);

  const getInjectedProviders = useCallback(() => {
    if (typeof window === 'undefined' || !window.ethereum) return [];
    if (Array.isArray(window.ethereum.providers) && window.ethereum.providers.length > 0) {
      return window.ethereum.providers;
    }
    return [window.ethereum];
  }, []);

  const detectWalletType = useCallback((provider) => {
    if (provider?.isTrust || provider?.isTrustWallet) return WALLET_TYPES.TRUST_WALLET;
    if (provider?.isCoinbaseWallet) return WALLET_TYPES.COINBASE;
    if (provider?.isMetaMask) return WALLET_TYPES.METAMASK;
    return WALLET_TYPES.METAMASK;
  }, []);

  const getErrorMessage = useCallback((err) => {
    if (err?.code === 4001) return 'Connection request rejected in wallet';
    if (err?.code === -32002) return 'A wallet request is already pending. Open the wallet extension and finish it first.';

    const rawMessage = err?.message || '';
    if (rawMessage.includes('Failed to connect to MetaMask')) {
      return 'MetaMask could not start the connection. Unlock MetaMask, approve the request there, or disable conflicting wallet extensions and try again.';
    }

    return rawMessage || 'Failed to connect to wallet';
  }, []);

  // Switch to Polygon network - defined first since other functions depend on it
  const switchToPolygon = useCallback(async (providerOverride = null) => {
    const provider = providerOverride || activeProviderRef.current || getInjectedProviders()[0] || null;
    if (!provider) return { success: false, error: 'No provider' };

    setSwitchingChain(true);

    try {
      // Try to switch to Polygon
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_CONFIG.chainId }],
      });

      setChainId(POLYGON_CHAIN_ID);
      setSwitchingChain(false);
      return { success: true };

    } catch (switchError) {
      // Chain not added to wallet - add it
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [POLYGON_CONFIG],
          });

          setChainId(POLYGON_CHAIN_ID);
          setSwitchingChain(false);
          return { success: true };

        } catch (addError) {
          console.error('Failed to add Polygon network:', addError);
          setSwitchingChain(false);
          return { success: false, error: 'Failed to add Polygon network' };
        }
      }

      console.error('Failed to switch to Polygon:', switchError);
      setSwitchingChain(false);
      return { success: false, error: getErrorMessage(switchError) };
    }
  }, [getErrorMessage, getInjectedProviders]);

  // Disconnect function - defined early since handlers use it
  const disconnect = useCallback(async (options = {}) => {
    const { remember = true } = options;
    setConnected(false);
    setAddress(null);
    setWalletType(null);
    setChainId(null);
    setError(null);
    activeProviderRef.current = null;
    setDisconnectPreference(remember);
  }, [setDisconnectPreference]);

  // Handler for account changes
  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length === 0) {
      disconnect({ remember: false });
      return;
    }

    if (getDisconnectPreference()) return;

    setAddress(accounts[0]);
  }, [disconnect, getDisconnectPreference]);

  // Handler for chain changes
  const handleChainChanged = useCallback((newChainId) => {
    const parsedChainId = parseInt(newChainId, 16);
    setChainId(parsedChainId);
  }, []);

  // Check for existing connection
  const checkConnection = useCallback(async () => {
    if (getDisconnectPreference()) return;

    const providers = getInjectedProviders();
    if (providers.length === 0) return;

    try {
      for (const provider of providers) {
        const accounts = await provider.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          activeProviderRef.current = provider;
          setAddress(accounts[0]);
          setConnected(true);
          setWalletType(detectWalletType(provider));

          const chainIdHex = await provider.request({ method: 'eth_chainId' });
          const currentChainId = parseInt(chainIdHex, 16);
          setChainId(currentChainId);

          // Auto-switch to Polygon if not already on it
          if (currentChainId !== POLYGON_CHAIN_ID) {
            await switchToPolygon(provider);
          }
          return;
        }
      }
    } catch (err) {
      console.error('Check connection error:', err);
    }
  }, [detectWalletType, getDisconnectPreference, getInjectedProviders, switchToPolygon]);

  // Check for existing connection on mount
  useEffect(() => {
    checkConnection();

    // Listen for account changes
    const providers = getInjectedProviders();
    if (providers.length > 0) {
      providers.forEach((provider) => {
        provider.on?.('accountsChanged', handleAccountsChanged);
        provider.on?.('chainChanged', handleChainChanged);
      });

      return () => {
        providers.forEach((provider) => {
          provider.removeListener?.('accountsChanged', handleAccountsChanged);
          provider.removeListener?.('chainChanged', handleChainChanged);
        });
      };
    }
  }, [checkConnection, getInjectedProviders, handleAccountsChanged, handleChainChanged]);

  const getProvider = useCallback((type) => {
    if (typeof window === 'undefined') return null;
    const providers = getInjectedProviders();

    switch (type) {
      case WALLET_TYPES.METAMASK:
        return providers.find((provider) => provider?.isMetaMask) || null;
      case WALLET_TYPES.TRUST_WALLET:
        return providers.find((provider) => provider?.isTrust || provider?.isTrustWallet) || null;
      case WALLET_TYPES.COINBASE:
        return providers.find((provider) => provider?.isCoinbaseWallet) || null;
      default:
        return providers[0] || null;
    }
  }, [getInjectedProviders]);

  const connect = useCallback(async (type = WALLET_TYPES.METAMASK) => {
    setConnecting(true);
    setError(null);
    setDisconnectPreference(false);

    try {
      const provider = getProvider(type);

      if (!provider) {
        const wallet = WALLETS.find(w => w.type === type);
        window.open(wallet?.downloadUrl || 'https://metamask.io/download/', '_blank');
        setConnecting(false);
        return { success: false, error: 'Wallet not installed' };
      }

      activeProviderRef.current = provider;

      // Request account access
      const accounts = await provider.request({ method: 'eth_requestAccounts' });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Get current chain ID
      const chainIdHex = await provider.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainIdHex, 16);

      setAddress(accounts[0]);
      setWalletType(type);
      setChainId(currentChainId);
      setConnected(true);

      // Auto-switch to Polygon if not already on it
      if (currentChainId !== POLYGON_CHAIN_ID) {
        const switchResult = await switchToPolygon(provider);
        if (!switchResult.success) {
          // Still connected but on wrong network
          setConnecting(false);
          return {
            success: true,
            address: accounts[0],
            chainId: currentChainId,
            warning: 'Please switch to Polygon network'
          };
        }
      }

      setConnecting(false);
      return { success: true, address: accounts[0], chainId: POLYGON_CHAIN_ID };

    } catch (err) {
      console.error('Wallet connection error:', err);
      activeProviderRef.current = null;
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setConnecting(false);
      return { success: false, error: errorMessage };
    }
  }, [getErrorMessage, getProvider, setDisconnectPreference, switchToPolygon]);

  const isOnPolygon = useMemo(() => chainId === POLYGON_CHAIN_ID, [chainId]);

  const value = useMemo(() => ({
    connected,
    address,
    publicKey: address, // Alias for compatibility
    walletType,
    walletName: walletType,
    chainId,
    connecting,
    switchingChain,
    error,
    connect,
    disconnect,
    switchToPolygon,
    isOnPolygon,
    wallets: WALLETS,
    WALLET_TYPES,
    POLYGON_CHAIN_ID,
    networkName: 'Polygon',
  }), [connected, address, walletType, chainId, connecting, switchingChain, error, connect, disconnect, switchToPolygon, isOnPolygon]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletProvider;
