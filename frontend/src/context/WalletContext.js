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

const WALLET_DISCONNECTED_KEY = 'investyz_wallet_disconnected';
const INVESTMENT_NETWORK_KEY =
  (process.env.REACT_APP_CRYPTO_PAYMENT_NETWORK || 'amoy').toLowerCase() === 'mainnet'
    ? 'mainnet'
    : 'amoy';
const CHAIN_CONFIGS = {
  amoy: {
    chainId: 80002,
    chainName: 'Polygon Amoy',
    nativeCurrency: {
      name: 'POL',
      symbol: 'POL',
      decimals: 18,
    },
    rpcUrls: ['https://rpc-amoy.polygon.technology'],
    blockExplorerUrls: ['https://amoy.polygonscan.com'],
  },
  mainnet: {
    chainId: 137,
    chainName: 'Polygon Mainnet',
    nativeCurrency: {
      name: 'POL',
      symbol: 'POL',
      decimals: 18,
    },
    rpcUrls: ['https://polygon-rpc.com', 'https://rpc-mainnet.maticvigil.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
  },
};
const ACTIVE_CHAIN_CONFIG = CHAIN_CONFIGS[INVESTMENT_NETWORK_KEY];
const POLYGON_CHAIN_ID = ACTIVE_CHAIN_CONFIG.chainId;
const POLYGON_CONFIG = {
  ...ACTIVE_CHAIN_CONFIG,
  chainId: `0x${ACTIVE_CHAIN_CONFIG.chainId.toString(16)}`,
};

const stripHexPrefix = (value = '') => String(value).replace(/^0x/i, '');

const encodeUint256 = (value) => BigInt(value).toString(16).padStart(64, '0');

const encodeAddress = (address) => stripHexPrefix(address).padStart(64, '0');

const encodeErc20TransferData = ({ recipient, amountAtomic }) =>
  `0xa9059cbb${encodeAddress(recipient)}${encodeUint256(amountAtomic)}`;

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
  const connectInFlightRef = useRef(false);

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

  const isMetaMaskProvider = useCallback((provider) => {
    if (!provider?.isMetaMask) return false;
    if (provider?.isTrust || provider?.isTrustWallet) return false;
    if (provider?.isCoinbaseWallet) return false;
    if (provider?.isBraveWallet) return false;

    const providerId = String(
      provider?.providerInfo?.rdns ||
      provider?.providerInfo?.uuid ||
      provider?.selectedProviderInfo?.rdns ||
      ''
    ).toLowerCase();

    if (providerId && !providerId.includes('metamask')) {
      return false;
    }

    return true;
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

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const isKnownMetaMaskFailure = (value) => {
      const message = String(value?.message || value || '');
      const stack = String(value?.stack || '');

      return (
        message.includes('Failed to connect to MetaMask') ||
        stack.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
        stack.includes('scripts/inpage.js')
      );
    };

    const handleUnhandledRejection = (event) => {
      if (!isKnownMetaMaskFailure(event?.reason)) return;
      event.preventDefault();
      console.warn('Suppressed MetaMask connection rejection:', event.reason);
    };

    const handleWindowError = (event) => {
      if (!isKnownMetaMaskFailure(event?.error || event?.message)) return;
      event.preventDefault();
      console.warn('Suppressed MetaMask connection error:', event.error || event.message);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleWindowError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleWindowError);
    };
  }, []);

  // Switch to the configured Polygon network - defined first since other functions depend on it
  const switchToPolygon = useCallback(async (providerOverride = null) => {
    const provider = providerOverride || activeProviderRef.current || getInjectedProviders()[0] || null;
    if (!provider) return { success: false, error: 'No provider' };

    setSwitchingChain(true);

    try {
      // Try to switch to the configured Polygon chain
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
          console.error(`Failed to add ${POLYGON_CONFIG.chainName} network:`, addError);
          setSwitchingChain(false);
          return { success: false, error: `Failed to add ${POLYGON_CONFIG.chainName} network` };
        }
      }

      console.error(`Failed to switch to ${POLYGON_CONFIG.chainName}:`, switchError);
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

          // Auto-switch to the configured Polygon chain if not already on it
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
        return providers.find((provider) => isMetaMaskProvider(provider)) || null;
      case WALLET_TYPES.TRUST_WALLET:
        return providers.find((provider) => provider?.isTrust || provider?.isTrustWallet) || null;
      case WALLET_TYPES.COINBASE:
        return providers.find((provider) => provider?.isCoinbaseWallet) || null;
      default:
        return providers[0] || null;
    }
  }, [getInjectedProviders, isMetaMaskProvider]);

  const connect = useCallback(async (type = WALLET_TYPES.METAMASK) => {
    if (connectInFlightRef.current || connecting) {
      return {
        success: false,
        error: 'A wallet connection is already in progress. Finish the MetaMask prompt and try again.',
      };
    }

    connectInFlightRef.current = true;
    setConnecting(true);
    setError(null);
    setDisconnectPreference(false);

    try {
      const provider = getProvider(type);

      if (!provider) {
        const wallet = WALLETS.find(w => w.type === type);
        window.open(wallet?.downloadUrl || 'https://metamask.io/download/', '_blank');
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

      // Auto-switch to the configured Polygon chain if not already on it
      if (currentChainId !== POLYGON_CHAIN_ID) {
        const switchResult = await switchToPolygon(provider);
        if (!switchResult.success) {
          // Still connected but on wrong network
          return {
            success: true,
            address: accounts[0],
            chainId: currentChainId,
            warning: `Please switch to ${POLYGON_CONFIG.chainName}`
          };
        }
      }

      return { success: true, address: accounts[0], chainId: POLYGON_CHAIN_ID };

    } catch (err) {
      console.error('Wallet connection error:', err);
      activeProviderRef.current = null;
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      connectInFlightRef.current = false;
      setConnecting(false);
    }
  }, [connecting, getErrorMessage, getProvider, setDisconnectPreference, switchToPolygon]);

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
    getActiveProvider: () => activeProviderRef.current,
    sendErc20Transfer: async ({ tokenAddress, recipient, amountAtomic }) => {
      const provider = activeProviderRef.current;
      if (!provider || !address) {
        throw new Error('Wallet not connected');
      }

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: address,
            to: tokenAddress,
            data: encodeErc20TransferData({ recipient, amountAtomic }),
            value: '0x0',
          },
        ],
      });

      return txHash;
    },
    isOnPolygon,
    wallets: WALLETS,
    WALLET_TYPES,
    POLYGON_CHAIN_ID,
    networkName: POLYGON_CONFIG.chainName,
  }), [connected, address, walletType, chainId, connecting, switchingChain, error, connect, disconnect, switchToPolygon, isOnPolygon]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletProvider;
