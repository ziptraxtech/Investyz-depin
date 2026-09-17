const axios = require('axios');
const env = require('../config/env');

const ERC20_TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const DEFAULT_CHAIN = {
  amoy: {
    key: 'amoy',
    chainId: 80002,
    name: 'Polygon Amoy',
    rpcUrl: env.POLYGON_AMOY_RPC_URL,
    explorerBaseUrl: 'https://amoy.polygonscan.com',
    nativeCurrency: 'POL',
  },
  mainnet: {
    key: 'mainnet',
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: env.POLYGON_MAINNET_RPC_URL,
    explorerBaseUrl: 'https://polygonscan.com',
    nativeCurrency: 'POL',
  },
};
const FALLBACK_FX_RATES = {
  USD: 1,
  INR: 83.5,
  AED: 3.67,
  SGD: 1.35,
};
const DEFAULT_TOKEN_CATALOG = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    type: 'erc20',
    pricing: 'peg_usd',
    isEnabled: true,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    type: 'erc20',
    pricing: 'peg_usd',
    isEnabled: true,
  },
  {
    symbol: 'BNB',
    name: 'Binance Coin',
    decimals: 18,
    type: 'erc20',
    pricing: 'manual',
    isEnabled: true,
  },
];
const SUPPORTED_FIAT_SET = new Set(env.CRYPTO_SUPPORTED_FIAT_CURRENCIES);

const normalizeAddress = (value) => String(value || '').trim().toLowerCase();

const sanitizeToken = (token = {}) => ({
  symbol: String(token.symbol || '').trim().toUpperCase(),
  name: String(token.name || '').trim(),
  address: normalizeAddress(token.address),
  decimals: Number(token.decimals ?? 6),
  type: token.type === 'native' ? 'native' : 'erc20',
  pricing: token.pricing || (String(token.symbol || '').toUpperCase().includes('USD') ? 'peg_usd' : 'manual'),
  usdPrice: Number(token.usdPrice ?? token.usd_price ?? 0),
  isEnabled: token.isEnabled !== false,
});

const getChainConfig = () => {
  const configured = DEFAULT_CHAIN[env.CRYPTO_PAYMENT_NETWORK] || DEFAULT_CHAIN.amoy;
  return configured;
};

const getExplorerUrl = (txHash) => {
  const chain = getChainConfig();
  if (!txHash) return '';
  return `${chain.explorerBaseUrl}/tx/${txHash}`;
};

const getConfiguredTokens = () => {
  const configuredTokens = env.CRYPTO_PAYMENT_TOKENS
    .map(sanitizeToken)
    .filter((token) => token.symbol && token.isEnabled);

  if (configuredTokens.length === 0) {
    return DEFAULT_TOKEN_CATALOG.map(sanitizeToken);
  }

  const mergedCatalog = [...configuredTokens];
  for (const defaultToken of DEFAULT_TOKEN_CATALOG) {
    if (!mergedCatalog.some((token) => token.symbol === defaultToken.symbol)) {
      mergedCatalog.push(sanitizeToken(defaultToken));
    }
  }

  return mergedCatalog;
};

const getTokenBySymbol = (symbol) => {
  const normalized = String(symbol || '').trim().toUpperCase();
  return getConfiguredTokens().find((token) => token.symbol === normalized) || null;
};

const padTopicAddress = (address) => `0x${normalizeAddress(address).replace(/^0x/, '').padStart(64, '0')}`;

const hexToBigInt = (hex) => BigInt(hex || '0x0');

const decimalToAtomicUnits = (amount, decimals) => {
  const [wholePartRaw, fractionPartRaw = ''] = String(amount).split('.');
  const wholePart = wholePartRaw.replace(/[^\d]/g, '') || '0';
  const paddedFraction = `${fractionPartRaw.replace(/[^\d]/g, '')}${'0'.repeat(decimals)}`.slice(0, decimals);
  const combined = `${wholePart}${paddedFraction}`.replace(/^0+/, '') || '0';
  return BigInt(combined);
};

const atomicUnitsToDecimal = (amountAtomic, decimals) => {
  const value = BigInt(amountAtomic);
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = value % base;
  const fractionString = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  return fractionString ? `${whole}.${fractionString}` : whole.toString();
};

const roundCurrency = (amount) => Math.round((Number(amount) + Number.EPSILON) * 100) / 100;

const getFxRates = async () => {
  try {
    const response = await axios.get(env.FX_RATE_SOURCE_URL, { timeout: 8000 });
    const rates = response.data?.rates || {};
    return {
      ...FALLBACK_FX_RATES,
      ...Object.fromEntries(
        Object.entries(rates).map(([currency, rate]) => [currency.toUpperCase(), Number(rate)])
      ),
    };
  } catch {
    return { ...FALLBACK_FX_RATES };
  }
};

const getTokenUsdPrice = async (token) => {
  if (!token) {
    throw new Error('Token configuration missing');
  }

  if (token.pricing === 'peg_usd') {
    return 1;
  }

  if (token.usdPrice > 0) {
    return token.usdPrice;
  }

  throw new Error(`No USD price source configured for ${token.symbol}`);
};

const createQuoteForToken = async ({
  amountInBaseCurrency,
  displayCurrency,
  tokenSymbol,
}) => {
  const baseCurrency = env.CRYPTO_FIAT_BASE_CURRENCY;
  const token = getTokenBySymbol(tokenSymbol);

  if (!token) {
    throw new Error(`Unsupported token: ${tokenSymbol}`);
  }

  if (!env.CRYPTO_TREASURY_ADDRESS) {
    throw new Error('CRYPTO_TREASURY_ADDRESS is not configured');
  }

  if (token.type === 'erc20' && !token.address) {
    throw new Error(`Token address missing for ${token.symbol}`);
  }

  const normalizedDisplayCurrency = String(displayCurrency || baseCurrency).trim().toUpperCase();
  if (!SUPPORTED_FIAT_SET.has(normalizedDisplayCurrency)) {
    throw new Error(`Unsupported display currency: ${normalizedDisplayCurrency}`);
  }

  const fxRates = await getFxRates();
  const usdPerBaseCurrency = 1 / Number(fxRates[baseCurrency] || 0);
  if (!usdPerBaseCurrency || !Number.isFinite(usdPerBaseCurrency)) {
    throw new Error(`Unsupported base currency: ${baseCurrency}`);
  }

  const tokenUsdPrice = await getTokenUsdPrice(token);
  const amountInUsd = Number(amountInBaseCurrency) * usdPerBaseCurrency;
  const tokenAmount = amountInUsd / tokenUsdPrice;
  const amountAtomic = decimalToAtomicUnits(tokenAmount.toFixed(token.decimals), token.decimals);
  const displayRate = Number(fxRates[normalizedDisplayCurrency] || 0);
  const displayAmount = displayRate > 0 ? amountInUsd * displayRate : Number(amountInBaseCurrency);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + env.CRYPTO_QUOTE_TTL_SECONDS * 1000);
  const chain = getChainConfig();

  return {
    token: {
      symbol: token.symbol,
      name: token.name || token.symbol,
      address: token.address,
      decimals: token.decimals,
      type: token.type,
    },
    chain: {
      key: chain.key,
      chain_id: chain.chainId,
      name: chain.name,
      native_currency: chain.nativeCurrency,
      explorer_base_url: chain.explorerBaseUrl,
    },
    treasury_address: normalizeAddress(env.CRYPTO_TREASURY_ADDRESS),
    source_amount: {
      currency: baseCurrency,
      value: roundCurrency(amountInBaseCurrency),
    },
    display_amount: {
      currency: normalizedDisplayCurrency,
      value: roundCurrency(displayAmount),
    },
    quote_amount: tokenAmount.toFixed(token.decimals),
    quote_amount_atomic: amountAtomic.toString(),
    pricing: {
      token_usd_price: tokenUsdPrice,
      fx_rates: Object.fromEntries(
        env.CRYPTO_SUPPORTED_FIAT_CURRENCIES.map((currency) => [
          currency,
          Number(fxRates[currency] || 0),
        ])
      ),
      source: token.pricing === 'peg_usd' ? 'peg_usd + er-api FX' : 'manual + er-api FX',
    },
    quoted_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    confirmation_target: env.CRYPTO_REQUIRED_CONFIRMATIONS,
  };
};

const rpcRequest = async (method, params = []) => {
  const chain = getChainConfig();
  if (!chain.rpcUrl) {
    throw new Error(`RPC URL is not configured for ${chain.name}`);
  }

  const response = await axios.post(
    chain.rpcUrl,
    {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    },
    { timeout: 10000 }
  );

  if (response.data?.error) {
    throw new Error(response.data.error.message || `RPC error calling ${method}`);
  }

  return response.data?.result;
};

const findTransferLogMatch = ({ receipt, tokenAddress, fromAddress, toAddress, expectedAmountAtomic }) => {
  const normalizedTokenAddress = normalizeAddress(tokenAddress);
  const fromTopic = padTopicAddress(fromAddress);
  const toTopic = padTopicAddress(toAddress);
  const expectedAmount = BigInt(expectedAmountAtomic);

  return (receipt?.logs || []).find((log) => {
    const topics = log?.topics || [];
    if (normalizeAddress(log?.address) !== normalizedTokenAddress) return false;
    if (topics[0]?.toLowerCase() !== ERC20_TRANSFER_TOPIC) return false;
    if (topics[1]?.toLowerCase() !== fromTopic) return false;
    if (topics[2]?.toLowerCase() !== toTopic) return false;
    return hexToBigInt(log?.data) === expectedAmount;
  }) || null;
};

const verifyCryptoTransfer = async ({ txHash, expectedFrom, quote }) => {
  const receipt = await rpcRequest('eth_getTransactionReceipt', [txHash]);
  const transaction = await rpcRequest('eth_getTransactionByHash', [txHash]);
  const chain = getChainConfig();

  if (!transaction) {
    return {
      status: 'submitted',
      payment_status: 'pending',
      confirmations: 0,
      chain_id: chain.chainId,
      explorer_url: getExplorerUrl(txHash),
      reason: 'Transaction not indexed yet',
    };
  }

  if (normalizeAddress(transaction.from) !== normalizeAddress(expectedFrom)) {
    throw new Error('Transaction sender does not match the connected wallet');
  }

  if (!receipt) {
    return {
      status: 'submitted',
      payment_status: 'pending',
      confirmations: 0,
      chain_id: chain.chainId,
      explorer_url: getExplorerUrl(txHash),
      reason: 'Transaction submitted but receipt is not available yet',
    };
  }

  if (receipt.status !== '0x1') {
    return {
      status: 'failed',
      payment_status: 'failed',
      confirmations: 0,
      chain_id: chain.chainId,
      explorer_url: getExplorerUrl(txHash),
      reason: 'Transaction reverted on-chain',
    };
  }

  const matchedTransfer = findTransferLogMatch({
    receipt,
    tokenAddress: quote?.token?.address,
    fromAddress: expectedFrom,
    toAddress: quote?.treasury_address,
    expectedAmountAtomic: quote?.quote_amount_atomic,
  });

  if (!matchedTransfer) {
    return {
      status: 'failed',
      payment_status: 'failed',
      confirmations: 0,
      chain_id: chain.chainId,
      explorer_url: getExplorerUrl(txHash),
      reason: 'Transaction does not contain the expected token transfer',
    };
  }

  const latestBlockHex = await rpcRequest('eth_blockNumber', []);
  const latestBlock = Number.parseInt(latestBlockHex, 16);
  const receiptBlock = Number.parseInt(receipt.blockNumber, 16);
  const confirmations = Math.max(latestBlock - receiptBlock + 1, 0);
  const isConfirmed = confirmations >= env.CRYPTO_REQUIRED_CONFIRMATIONS;

  return {
    status: isConfirmed ? 'completed' : 'confirming',
    payment_status: isConfirmed ? 'paid' : 'pending',
    confirmations,
    chain_id: chain.chainId,
    explorer_url: getExplorerUrl(txHash),
    reason: isConfirmed ? 'Transfer verified on-chain' : 'Waiting for required confirmations',
    block_number: receiptBlock,
    transfer_amount: atomicUnitsToDecimal(quote.quote_amount_atomic, quote.token.decimals),
  };
};

module.exports = {
  atomicUnitsToDecimal,
  createQuoteForToken,
  getChainConfig,
  getConfiguredTokens,
  getExplorerUrl,
  getTokenBySymbol,
  normalizeAddress,
  verifyCryptoTransfer,
};
