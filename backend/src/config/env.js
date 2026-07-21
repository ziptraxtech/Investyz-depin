/**
 * Environment Configuration
 * Loads and validates environment variables
 */
require('dotenv').config();

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const env = {
  // Server
  PORT: process.env.PORT || 8001,
  HOST: process.env.HOST || 'localhost',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI?.trim() || '',
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:27017',
  DB_NAME: process.env.DB_NAME || 'test_database',
  DATABASE_URL: process.env.DATABASE_URL || '',
  KYC_ENCRYPTION_KEY: process.env.KYC_ENCRYPTION_KEY?.trim() || '',
  
  // CORS
  CORS_ORIGINS: process.env.CORS_ORIGINS || '*',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'default_jwt_secret',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',
  JWT_EXPIRES_IN_SECONDS: Number(process.env.JWT_EXPIRES_IN_SECONDS || 7 * 24 * 60 * 60),
  
  // Stripe
  STRIPE_API_KEY: process.env.STRIPE_API_KEY?.trim() || '',

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID?.trim() || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET?.trim() || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || '',
  RAZORPAY_CURRENCY: process.env.RAZORPAY_CURRENCY?.trim().toUpperCase() || 'INR',
  RAZORPAY_SUCCESS_URL: process.env.RAZORPAY_SUCCESS_URL?.trim() || '',
  RAZORPAY_CANCEL_URL: process.env.RAZORPAY_CANCEL_URL?.trim() || '',
  RAZORPAY_MOCK_MODE: process.env.RAZORPAY_MOCK_MODE
    ? process.env.RAZORPAY_MOCK_MODE !== 'false'
    : process.env.NODE_ENV !== 'production',

  // Crypto payments
  CRYPTO_PAYMENTS_ENABLED: process.env.CRYPTO_PAYMENTS_ENABLED !== 'false',
  CRYPTO_PAYMENT_NETWORK: process.env.CRYPTO_PAYMENT_NETWORK?.trim() || 'amoy',
  CRYPTO_TREASURY_ADDRESS: process.env.CRYPTO_TREASURY_ADDRESS?.trim() || '',
  CRYPTO_REQUIRED_CONFIRMATIONS: parseNumber(process.env.CRYPTO_REQUIRED_CONFIRMATIONS, 1),
  CRYPTO_QUOTE_TTL_SECONDS: parseNumber(process.env.CRYPTO_QUOTE_TTL_SECONDS, 900),
  CRYPTO_SUPPORTED_FIAT_CURRENCIES: (process.env.CRYPTO_SUPPORTED_FIAT_CURRENCIES || 'INR,USD,AED,SGD')
    .split(',')
    .map((currency) => currency.trim().toUpperCase())
    .filter(Boolean),
  CRYPTO_FIAT_BASE_CURRENCY: process.env.CRYPTO_FIAT_BASE_CURRENCY?.trim().toUpperCase() || 'INR',
  POLYGON_AMOY_RPC_URL: process.env.POLYGON_AMOY_RPC_URL?.trim() || '',
  POLYGON_MAINNET_RPC_URL: process.env.POLYGON_MAINNET_RPC_URL?.trim() || '',
  CRYPTO_PAYMENT_TOKENS: parseJson(process.env.CRYPTO_PAYMENT_TOKENS, []),
  FX_RATE_SOURCE_URL: process.env.FX_RATE_SOURCE_URL?.trim() || 'https://open.er-api.com/v6/latest/USD',

  // Cashfree Secure ID / DigiLocker
  CASHFREE_CLIENT_ID: process.env.CASHFREE_CLIENT_ID?.trim() || '',
  CASHFREE_CLIENT_SECRET: process.env.CASHFREE_CLIENT_SECRET?.trim() || '',
  CASHFREE_ENV: process.env.CASHFREE_ENV?.trim() || 'sandbox',
  CASHFREE_REDIRECT_URL: process.env.CASHFREE_REDIRECT_URL?.trim() || '',

  // Decentro Sandbox KYC
  DECENTRO_BASE_URL: process.env.DECENTRO_BASE_URL?.trim() || 'https://in.staging.decentro.tech',
  DECENTRO_CLIENT_ID: process.env.DECENTRO_CLIENT_ID?.trim() || '',
  DECENTRO_CLIENT_SECRET: process.env.DECENTRO_CLIENT_SECRET?.trim() || '',
  DECENTRO_API_TOKEN: process.env.DECENTRO_API_TOKEN?.trim() || '',
  DECENTRO_MODULE_SECRET: process.env.DECENTRO_MODULE_SECRET?.trim() || '',
  DECENTRO_KYC_AND_ONBOARDING_MODULE_SECRET:
    process.env.DECENTRO_KYC_AND_ONBOARDING_MODULE_SECRET?.trim()
    || process.env.DECENTRO_MODULE_SECRET?.trim()
    || '',
  DECENTRO_CORE_BANKING_MODULE_SECRET:
    process.env.DECENTRO_CORE_BANKING_MODULE_SECRET?.trim() || '',
  DECENTRO_FINANCIAL_SERVICES_MODULE_SECRET:
    process.env.DECENTRO_FINANCIAL_SERVICES_MODULE_SECRET?.trim() || '',
  DECENTRO_PROVIDER_SECRET: process.env.DECENTRO_PROVIDER_SECRET?.trim() || '',
  DECENTRO_ZOOPONE_PROVIDER_SECRET:
    process.env.DECENTRO_ZOOPONE_PROVIDER_SECRET?.trim()
    || process.env.DECENTRO_PROVIDER_SECRET?.trim()
    || '',
  DECENTRO_YES_BANK_PROVIDER_SECRET:
    process.env.DECENTRO_YES_BANK_PROVIDER_SECRET?.trim() || '',
  DECENTRO_EQUIFAX_PROVIDER_SECRET:
    process.env.DECENTRO_EQUIFAX_PROVIDER_SECRET?.trim() || '',
  DECENTRO_REDIRECT_URL: process.env.DECENTRO_REDIRECT_URL?.trim() || '',
  DECENTRO_WEBHOOK_SECRET: process.env.DECENTRO_WEBHOOK_SECRET?.trim() || process.env.WEBHOOK_SECRET?.trim() || '',
  DECENTRO_CONSENT_PURPOSE: process.env.DECENTRO_CONSENT_PURPOSE?.trim() || 'Investor onboarding KYC verification for Investyz users',
  KYC_MOCK_MODE: process.env.KYC_MOCK_MODE !== 'false',

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID?.trim() || '',

  // Clerk auth
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY?.trim() || '',
  CLERK_ISSUER: process.env.CLERK_ISSUER?.trim() || '',
  
  // Wallet Configuration
  wallets: {
    METAMASK_ENABLED: process.env.METAMASK_ENABLED === 'true',
    TRUST_WALLET_ENABLED: process.env.TRUST_WALLET_ENABLED === 'true',
    WALLETCONNECT_ENABLED: process.env.WALLETCONNECT_ENABLED === 'true',
    WALLETCONNECT_PROJECT_ID: process.env.WALLETCONNECT_PROJECT_ID || '',
    SUPPORTED_CHAIN_IDS: (process.env.SUPPORTED_CHAIN_IDS || '80002,137,1,56').split(',').map(Number),
  },
  
  // Helper methods
  isDevelopment: () => env.NODE_ENV === 'development',
  isProduction: () => env.NODE_ENV === 'production',
};

module.exports = env;
